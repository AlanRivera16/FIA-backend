import express from 'express';
import cors from 'cors';
import { connectDB } from './src/utils/conection-database.js'
import { register, login } from './src/controllers/authControllers.js';
import authRoutes from './src/routes/authRoutes.js';
import usuariosRoute from './src/routes/usuarios.route.js'
import prestamosRoute from './src/routes/prestamos.route.js'
import historialRoute from './src/routes/historial.route.js'
import dotenv from 'dotenv';
import cron from 'node-cron'
import Prestamo from "../fia-backend-app/src/models/prestamo.model.js"

dotenv.config();

cron.schedule('35 15 * * *', async () =>{
  console.log('⏳ Ejecutando tarea automática para verificar pagos vencidos...')

  try {
    const hoy = new Date();

    // Buscar préstamos activos que tienen pagos vencidos
    const prestamosVencidos = await Prestamo.find({
      estado: { $ne: 'Cerrado' }, // Evitar préstamos ya cerrados
      'tabla_amortizacion.fecha_pago': { $lt: hoy }, // Pagos con fecha pasada
      'tabla_amortizacion.estado_pago': 'No pagado', // Aún no pagados
      'tabla_amortizacion.multa.saldado': false // Aún no pagados
    });

    // console.log(prestamosVencidos)

    // Actualizar cada pago vencido con multa e interés
    for (const prestamo of prestamosVencidos) {
      for (const pago of prestamo.tabla_amortizacion) {
        if (pago.fecha_pago < hoy && pago.estado_pago === 'No pagado') {
          const diasRetraso = Math.floor((hoy - pago.fecha_pago) / (1000 * 60 * 60 * 24));
          const multaDiaria = pago.cuota * 0.1; // 10% de multa por día
          pago.multa = {
            dia_retraso: diasRetraso,
            monto_pendiente: diasRetraso * multaDiaria,
            saldado: false
          };
          console.log(pago.multa)
          console.log('---------------------------------')
          // console.log(pago.estado)
        }
      }

      // Guardar cambios en el préstamo
    //   console.log(prestamosVencidos[0])
      await prestamo.save();
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
