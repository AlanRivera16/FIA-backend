import express from 'express';
import cors from 'cors';
import { connectDB } from './src/utils/conection-database.js'
import { register, login } from './src/controllers/authControllers.js';
import authRoutes from './src/routes/authRoutes.js';
import usuariosRoute from './src/routes/usuarios.route.js'
import prestamosRoute from './src/routes/prestamos.route.js'
import historialRoute from './src/routes/historial.route.js'
import walletRoute from './src/routes/wallet.route.js'
import notificacionesRoute from './src/routes/notificaciones.route.js';
import dotenv from 'dotenv';
import cron from 'node-cron'
import Prestamo from "./src/models/prestamo.model.js"
import Historial from "./src/models/historial.model.js"
import { calcularEstadoGeneral, calcular15Semana } from "./funciones.js"
import { calcularTotales } from './src/controllers/prestamos.controller.js'
import fileUpload from 'express-fileupload';
import Notificacion from './src/models/notificaciones.model.js';
import { generarMensajeNotificacion } from './src/utils/notificaciones.utils.js';
import Usuario from './src/models/usuario.model.js';


dotenv.config();
        // minute / hour / day / month / day 
cron.schedule('1 20 * * *', async () =>{
  console.log('⏳ Ejecutando tarea automática para verificar pagos vencidos...')

  try {
    const ahora = new Date(); // Fecha y hora actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer hoy a las 00:00

    const horaCorte = new Date(hoy);
    horaCorte.setHours(20, 1, 0, 0); // 20:01 de hoy

    console.log(`🕒 Ahora: ${ahora}`);
    console.log(`📆 Hoy (00:00): ${hoy}`);
    console.log(`⏳ Hora Corte (20:01): ${horaCorte}`);

    // Buscar préstamos activos que tienen pagos vencidos
    const prestamosVencidos = await Prestamo.find({
      estado: 'Aceptado', // Evitar préstamos ya cerrados
      $or: [
        { 'tabla_amortizacion.fecha_pago': { $lt: hoy } }, // Fechas pasadas
        {
          'tabla_amortizacion.fecha_pago': { $eq: hoy }, // Fechas de hoy
          'tabla_amortizacion.estado_pago': 'No pagado', // Aún no pagados
          'tabla_amortizacion.multa.saldado': false //Aún no pagados
        }
      ]
    });

    // console.log(prestamosVencidos)

    // Actualizar cada pago vencido con multa e interés
    for (const prestamo of prestamosVencidos) {
      const idCliente = prestamo.id_cliente; // Obtener ID del cliente

      //Calcular 15va semana
      if(prestamo.periodo == 14){
        await calcular15Semana(prestamo);
      }

      // Calcular estado general del cliente
      const historialActualizado = await Historial.findOne({ id_usuario: idCliente }); // 🔹 **Obtener historial actualizado**

      if (historialActualizado) {
        // 🔹 **Calcular estado general**
        const estadoGeneral = calcularEstadoGeneral(historialActualizado);
        console.log(estadoGeneral)

        // 🔹 **Actualizar estado en historial**
        await Historial.updateOne(
          { id_usuario: idCliente },
          { $set: { estado_general: estadoGeneral } }
        );

        console.log(`📊 Estado general actualizado: ${estadoGeneral} para el cliente ${idCliente}`);
      }


      for (const pago of prestamo.tabla_amortizacion) {
        const fechaPago = new Date(pago.fecha_pago); // Convertimos la fecha de pago
        fechaPago.setHours(0, 0, 0, 0); // Normalizar fecha a 00:00

        console.log(`📆 Pago num ${pago.num_pago} -> Fecha de pago: ${fechaPago}`);


        if ((fechaPago < hoy || (fechaPago.getTime() === hoy.getTime() && ahora >= horaCorte)) && pago.estado_pago === 'No pagado') {
          let diasRetraso = Math.floor((ahora - fechaPago) / (1000 * 60 * 60 * 24));

          // 🚀 **Si es el mismo día pero ya pasó de las 20:01, cuenta como un día de retraso**
          if (fechaPago.getTime() === hoy.getTime() && ahora >= horaCorte) {
            diasRetraso = 1;
            console.log(`Ya pasó la hora, prestamode${prestamo.saldo}`)
          }

          const multaDiaria = pago.cuota * 0.1; // 10% de multa por día
          
          // Actualizar la multa en el préstamo
          pago.multa = {
            dia_retraso: diasRetraso,
            monto_pendiente: diasRetraso * multaDiaria,
            saldado: false
          };

          console.log(`💰 Multa actualizada para pago ${pago.num_pago}:`, pago.multa);

          // 1️⃣ **Verificar si ya se registró este retraso en el historial**
          const existeRetraso = await Historial.findOne({
            id_usuario: idCliente,
            'detalles_retrasos.num_pago': pago.num_pago // Verificar si este pago ya fue registrado
          });

          if (!existeRetraso) {
            // 2️⃣ **Registrar el retraso en el historial**
            await Historial.updateOne(
              { id_usuario: idCliente },
              {
                $inc: { retrasos_totales: 1 }, // Incrementar el total de retrasos
                $push: {
                  detalles_retrasos: {
                    id_prestamo: prestamo._id,
                    num_pago: pago.num_pago,
                    fecha_retraso: hoy
                  }
                }
              },
              //{ new: true, upsert: true } // Crear un nuevo historial si no existe
            );

            console.log(`📌 Retraso registrado en historial del cliente ${idCliente} para pago ${pago.num_pago}`);
          }

        }
      }

      // Al final, recalcula los totales
      const { totalPagado, totalCuota, totalMultas, totalPendiente } = calcularTotales(prestamo.tabla_amortizacion);

      prestamo.totalPagado = totalPagado;
      prestamo.totalCuota = totalCuota;
      prestamo.totalMultas = totalMultas;
      prestamo.totalPendiente = totalPendiente;
      await prestamo.save();

      // Actualiza el historial
      await Historial.updateOne(
        { id_usuario: prestamo.id_cliente, "prestamos_detallados.id_prestamo": prestamo._id },
        {
          $set: {
            "prestamos_detallados.$.saldo_pendiente": totalPendiente,
            "prestamos_detallados.$.multas_pendientes": totalMultas,
            "prestamos_detallados.$.pagos_pendientes": totalCuota,
            "prestamos_detallados.$.total_pagado": totalPagado,
            "prestamos_detallados.$.estado": prestamo.estado
          }
        }
      );
    }
    // console.log(prestamosVencidos)
    console.log(`✅ ${prestamosVencidos.length} préstamos actualizados.`);
  } catch (error) {
    console.error('❌ Error en la tarea de verificación de pagos vencidos:', error);
  }
})

const app = express();
app.use(cors());

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : './uploads'
}));

//settings routes
app.post('/register', register);
app.post('/login', login);

app.get('/', (req,res) => {
    res.send('Bienvenido a servidor REST de ALAN');
});
app.get('/users', (req,res) => {
    res.send('Lista de usuarios');
});

app.use(authRoutes);
app.use(usuariosRoute);
app.use(prestamosRoute);
app.use(historialRoute);
app.use(walletRoute);
app.use(notificacionesRoute)

// mongoose
//   .connect(mongoUri)
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((error) => {
//     console.log({ error });
//   });
connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error)=>{
    console.log('Error connecting to MongoDB',error);
})


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
