import Prestamo from "./src/models/prestamo.model.js"
import Notificacion from './src/models/notificaciones.model.js';
import { generarMensajeNotificacion } from './src/utils/notificaciones.utils.js';
import Usuario from './src/models/usuario.model.js';
//export function monstrarMesaje(){
//    console.log("Hola desde el archivo funcuiones.js")
//}

export const calcularEstadoGeneral = (historial) => {
    const { prestamos_totales, retrasos_totales, monto_total_pendiente } = historial;
    console.log(prestamos_totales, retrasos_totales, monto_total_pendiente)

    if (retrasos_totales === 0 && monto_total_pendiente === 0) return 'Excelente';
    if (retrasos_totales / prestamos_totales < 0.2) return 'Bueno';
    if (retrasos_totales / prestamos_totales <= 0.5) return 'Regular';
    return 'Malo';
}

// export const calcular15Semana = async (prestamo) => {

//     // 1️⃣ Filtrar los pagos que tienen multa activa
//     const retrasosTotales = prestamo.tabla_amortizacion.filter((pago) => pago.multa.monto_pendiente > 0);
//     const cantidadRetrasos = retrasosTotales.length;


//     // 3️⃣ Calcular cuántos pagos extra ya existen (por ejemplo, num_pago > N original)
//     const pagosOriginales = prestamo.tabla_amortizacion.filter(p => p.num_pago <= prestamo.periodo);
//     // 2️⃣ Calcular cuántos pagos extra deberían existir
//     const cantidadPagosExtraEsperados = Math.floor(retrasosTotales.length / 3);
//     const numPagosActuales = prestamo.tabla_amortizacion.length;

//     const pagosExtraYaAgregados  = numPagosActuales - pagosOriginales.length;

//     const pagosFaltantes = cantidadPagosExtraEsperados - pagosExtraYaAgregados ;

//     if (pagosFaltantes > 0) {
//         // Obtener el último pago original (ej: num_pago === 14)
//         const ultimoPago = pagosOriginales.sort((a, b) => b.num_pago - a.num_pago)[0];

//         if (!ultimoPago) {
//             console.warn(`❌ No se encontró el último pago original en el préstamo ${prestamo._id}`);
//             return;
//         }

//         const nuevaFechaBase = new Date(ultimoPago.fecha_pago);

//         for (let i = 1; i <= pagosFaltantes; i++) {
//             const nuevoNumPago = numPagosActuales + i;
//             const nuevaFechaPago = new Date(nuevaFechaBase);
//             nuevaFechaPago.setDate(nuevaFechaPago.getDate() + 7 * i)
    
//             const nuevoPago = {
//                 num_pago: nuevoNumPago,
//                 fecha_pago: nuevaFechaPago,
//                 cuota: ultimoPago.cuota, // o puedes usar lógica diferente si la cuota cambia
//                 estado_pago: 'No pagado',
//                 multa: {
//                   dia_retraso: 0,
//                   monto_pendiente: 0,
//                   saldado: false,
//                   fecha_pago: null
//                 },
//                 notas: 'Pago generado automáticamente por retrasos frecuentes'
//             };
//             await Prestamo.updateOne(
//                 { _id: prestamo._id },
//                 {
//                   $push: {
//                     tabla_amortizacion: nuevoPago
//                   }
//                 }
//               );
//           // Crear notificación de retraso para el super usuario
//           try {
//             const superUserId = process.env.SUPERUSER_ID;
//             const cliente = await Usuario.findById(prestamo.id_cliente);
//             if (cliente && superUserId) {
//               const mensaje = generarMensajeNotificacion({
//                 type: 'retraso',
//                 data: { monto_prestamo: prestamo.saldo },
//                 from: cliente,
//                 to: null
//               });

//               await Notificacion.create({
//                 type: 'retraso',
//                 userId: superUserId,
//                 from: cliente._id,
//                 mensaje,
//                 data: { id_prestamo: prestamo._id }
//               });
//               console.log(`🔔 Notificación de retraso creada para el super usuario por el préstamo ${prestamo._id}`);
//             }
//           } catch (err) {
//             console.error('❌ Error al crear notificación de retraso:', err);
//           }
    
//             console.log(`🟢 Nuevo pago agregado (num_pago: ${nuevoNumPago}) para préstamo ${prestamo._id}`);
//         }
//     } else {
//       console.log(`📌 No se necesitan nuevos pagos para préstamo ${prestamo._id} (retrasos: ${cantidadRetrasos})`);
//     }
// };



//2da version de calcular15Semana (antes de junta formal con F - 12/11/2025 )
// export const calcular15Semana = async (prestamo) => {
//   const pagosConMulta = prestamo.tabla_amortizacion.filter(pago => pago.multa.dia_retraso > 0);
//   const numPagosActuales = prestamo.tabla_amortizacion.length;

//   // Si ya tiene 16 pagos, no agregues más
//   if (numPagosActuales >= 16) {
//     console.log(`📌 Préstamo ${prestamo._id} ya tiene el máximo de 16 pagos.`);
//     return;
//   }

//   // Obtener cliente y asesor
//   const cliente = await Usuario.findById(prestamo.id_cliente);
//   const asesorId = prestamo.assigned_to; // Asume que tienes este campo en el modelo
//   const superUserId = process.env.SUPERUSER_ID;

//   // Si tiene 3 pagos con multa y aún no existe el pago #15, agrégalo
//   if (pagosConMulta.length >= 3 && !prestamo.tabla_amortizacion.find(p => p.num_pago === 15)) {
//     const ultimoPago = [...prestamo.tabla_amortizacion].sort((a, b) => b.num_pago - a.num_pago)[0];
//     const nuevaFechaPago = new Date(ultimoPago.fecha_pago);
//     nuevaFechaPago.setDate(nuevaFechaPago.getDate() + 7);

//     const nuevoPago = {
//       num_pago: 15,
//       fecha_pago: nuevaFechaPago,
//       cuota: ultimoPago.cuota,
//       estado_pago: 'No pagado',
//       multa: {
//         dia_retraso: 0,
//         monto_pendiente: 0,
//         saldado: false,
//         fecha_pago: null
//       },
//       notas: 'Pago 15 generado automáticamente por 3 retrasos'
//     };
//     await Prestamo.updateOne(
//       { _id: prestamo._id },
//       { $push: { tabla_amortizacion: nuevoPago } }
//     );
//     console.log(`🟢 Pago #15 agregado para préstamo ${prestamo._id}`);

//     // Notificación para super usuario
//     if (cliente && superUserId) {
//       const mensajeSuper = generarMensajeNotificacion({
//         type: 'retraso',
//         data: { monto_prestamo: prestamo.saldo, semana: 15 },
//         from: cliente,
//         to: null
//       });
//       await Notificacion.create({
//         type: 'retraso',
//         userId: superUserId,
//         from: cliente._id,
//         mensaje: mensajeSuper,
//         data: { id_prestamo: prestamo._id, semana: 15 }
//       });
//       console.log(`🔔 Notificación de semana 15 creada para el super usuario por el préstamo ${prestamo._id}`);
//     }
//     // Notificación para asesor asignado
//     if (cliente && asesorId) {
//       const mensajeAsesor = generarMensajeNotificacion({
//         type: 'retraso',
//         data: { monto_prestamo: prestamo.saldo, semana: 15 },
//         from: cliente,
//         to: asesorId
//       });
//       await Notificacion.create({
//         type: 'retraso',
//         userId: asesorId,
//         from: cliente._id,
//         mensaje: mensajeAsesor,
//         data: { id_prestamo: prestamo._id, semana: 15 }
//       });
//       console.log(`🔔 Notificación de semana 15 creada para el asesor ${asesorId} por el préstamo ${prestamo._id}`);
//     }
//   }

//   // Si existe algún pago cuya multa es mayor al monto original y aún no existe el pago #16, agrégalo
//   const pagoMultaMayor = prestamo.tabla_amortizacion.find(
//     pago => pago.multa.monto_pendiente > pago.cuota
//   );
//   if (pagoMultaMayor && !prestamo.tabla_amortizacion.find(p => p.num_pago === 16)) {
//     const ultimoPago = [...prestamo.tabla_amortizacion].sort((a, b) => b.num_pago - a.num_pago)[0];
//     const nuevaFechaPago = new Date(ultimoPago.fecha_pago);
//     nuevaFechaPago.setDate(nuevaFechaPago.getDate() + 7);

//     const nuevoPago = {
//       num_pago: 16,
//       fecha_pago: nuevaFechaPago,
//       cuota: ultimoPago.cuota,
//       estado_pago: 'No pagado',
//       multa: {
//         dia_retraso: 0,
//         monto_pendiente: 0,
//         saldado: false,
//         fecha_pago: null
//       },
//       notas: 'Pago 16 generado automáticamente por multa mayor al pago original'
//     };
//     await Prestamo.updateOne(
//       { _id: prestamo._id },
//       { $push: { tabla_amortizacion: nuevoPago } }
//     );
//     console.log(`🟢 Pago #16 agregado para préstamo ${prestamo._id}`);

//     // Notificación para super usuario
//     if (cliente && superUserId) {
//       const mensajeSuper = generarMensajeNotificacion({
//         type: 'retraso',
//         data: { monto_prestamo: prestamo.saldo, semana: 16 },
//         from: cliente,
//         to: null
//       });
//       await Notificacion.create({
//         type: 'retraso',
//         userId: superUserId,
//         from: cliente._id,
//         mensaje: mensajeSuper,
//         data: { id_prestamo: prestamo._id, semana: 16 }
//       });
//       console.log(`🔔 Notificación de semana 16 creada para el super usuario por el préstamo ${prestamo._id}`);
//     }
//     // Notificación para asesor asignado
//     if (cliente && asesorId) {
//       const mensajeAsesor = generarMensajeNotificacion({
//         type: 'retraso',
//         data: { monto_prestamo: prestamo.saldo, semana: 16 },
//         from: cliente,
//         to: asesorId
//       });
//       await Notificacion.create({
//         type: 'retraso',
//         userId: asesorId,
//         from: cliente._id,
//         mensaje: mensajeAsesor,
//         data: { id_prestamo: prestamo._id, semana: 16 }
//       });
//       console.log(`🔔 Notificación de semana 16 creada para el asesor ${asesorId} por el préstamo ${prestamo._id}`);
//     }
//   }
// };

export async function calcular15Semana(prestamo) {
  try {
    // 🔹 Solo aplicar para préstamos semanales
    if (prestamo.tipo_pago !== 'Semanal') {
      return;
    }

    const tablaAmortizacion = prestamo.tabla_amortizacion;
    const ultimoPago = tablaAmortizacion[tablaAmortizacion.length - 1];
    const numeroPagosBase = prestamo.periodo;

    // 🔹 Verificar si algún pago tiene 3 días de retraso (3 multas)
    const pagoConTresRetrasos = tablaAmortizacion.find(
      pago => pago.multa && pago.multa.dia_retraso >= 3 && pago.estado_pago !== 'Pagado'
    );

    // 🔹 Verificar si algún pago tiene multa mayor al monto original
    const pagoConMultaMayor = tablaAmortizacion.find(
      pago => pago.multa && pago.multa.monto_pendiente > pago.cuota && pago.estado_pago !== 'Pagado'
    );

    // 🔹 Verificar si ya existe el pago #15
    const existePago15 = tablaAmortizacion.some(pago => pago.num_pago === numeroPagosBase + 1);

    // 🔹 Verificar si ya existe el pago #16
    const existePago16 = tablaAmortizacion.some(pago => pago.num_pago === numeroPagosBase + 2);

    // 🔹 CREAR PAGO #15 si hay un pago con 3 días de retraso y no existe aún
    if (pagoConTresRetrasos && !existePago15) {
      const fechaUltimoPago = new Date(ultimoPago.fecha_pago);
      const nuevaFechaPago = new Date(fechaUltimoPago);
      nuevaFechaPago.setDate(fechaUltimoPago.getDate() + 7);

      const nuevoPago15 = {
        num_pago: numeroPagosBase + 1,
        fecha_pago: nuevaFechaPago,
        cuota: ultimoPago.cuota,
        estado_pago: 'No pagado',
        abono_pago: 0,
        multa: {
          dia_retraso: 0,
          monto_pendiente: 0,
          saldado: false,
          fecha_pago: null
        },
        aceptado: false,
        comprobantes: [],
        notas: `Pago extra #15 generado automáticamente por 3 días de retraso en pago #${pagoConTresRetrasos.num_pago}`
      };

      tablaAmortizacion.push(nuevoPago15);
      await prestamo.save();

      console.log(`✅ Pago #${numeroPagosBase + 1} (15va semana) creado automáticamente`);
    }

    // 🔹 CREAR PAGO #16 si hay multa mayor al monto, existe pago #15 y no existe pago #16
    if (pagoConMultaMayor && existePago15 && !existePago16) {
      const pago15 = tablaAmortizacion.find(pago => pago.num_pago === numeroPagosBase + 1);
      const fechaPago15 = new Date(pago15.fecha_pago);
      const nuevaFechaPago = new Date(fechaPago15);
      nuevaFechaPago.setDate(fechaPago15.getDate() + 7);

      const nuevoPago16 = {
        num_pago: numeroPagosBase + 2,
        fecha_pago: nuevaFechaPago,
        cuota: pago15.cuota,
        estado_pago: 'No pagado',
        abono_pago: 0,
        multa: {
          dia_retraso: 0,
          monto_pendiente: 0,
          saldado: false,
          fecha_pago: null
        },
        aceptado: false,
        comprobantes: [],
        notas: `Pago extra #16 generado automáticamente por multa mayor al monto en pago #${pagoConMultaMayor.num_pago}`
      };

      tablaAmortizacion.push(nuevoPago16);
      await prestamo.save();

      console.log(`✅ Pago #${numeroPagosBase + 2} (16va semana) creado automáticamente`);
    }

  } catch (error) {
    console.error('❌ Error en calcular15Semana:', error);
  }
}