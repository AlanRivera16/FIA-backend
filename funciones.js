import Prestamo from "../fia-backend-app/src/models/prestamo.model.js"
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

export const calcular15Semana = async (prestamo) => {

    // 1️⃣ Filtrar los pagos que tienen multa activa
    const retrasosTotales = prestamo.tabla_amortizacion.filter((pago) => pago.multa.monto_pendiente > 0);
    const cantidadRetrasos = retrasosTotales.length;


    // 3️⃣ Calcular cuántos pagos extra ya existen (por ejemplo, num_pago > N original)
    const pagosOriginales = prestamo.tabla_amortizacion.filter(p => p.num_pago <= prestamo.periodo);
    // 2️⃣ Calcular cuántos pagos extra deberían existir
    const cantidadPagosExtraEsperados = Math.floor(retrasosTotales.length / 3);
    const numPagosActuales = prestamo.tabla_amortizacion.length;

    const pagosExtraYaAgregados  = numPagosActuales - pagosOriginales.length;

    const pagosFaltantes = cantidadPagosExtraEsperados - pagosExtraYaAgregados ;

    if (pagosFaltantes > 0) {
        // Obtener el último pago original (ej: num_pago === 14)
        const ultimoPago = pagosOriginales.sort((a, b) => b.num_pago - a.num_pago)[0];

        if (!ultimoPago) {
            console.warn(`❌ No se encontró el último pago original en el préstamo ${prestamo._id}`);
            return;
        }

        const nuevaFechaBase = new Date(ultimoPago.fecha_pago);

        for (let i = 1; i <= pagosFaltantes; i++) {
            const nuevoNumPago = numPagosActuales + i;
            const nuevaFechaPago = new Date(nuevaFechaBase);
            nuevaFechaPago.setDate(nuevaFechaPago.getDate() + 7 * i)
    
            const nuevoPago = {
                num_pago: nuevoNumPago,
                fecha_pago: nuevaFechaPago,
                cuota: ultimoPago.cuota, // o puedes usar lógica diferente si la cuota cambia
                estado_pago: 'No pagado',
                multa: {
                  dia_retraso: 0,
                  monto_pendiente: 0,
                  saldado: false,
                  fecha_pago: null
                },
                notas: 'Pago generado automáticamente por retrasos frecuentes'
            };
            await Prestamo.updateOne(
                { _id: prestamo._id },
                {
                  $push: {
                    tabla_amortizacion: nuevoPago
                  }
                }
              );
    
            console.log(`🟢 Nuevo pago agregado (num_pago: ${nuevoNumPago}) para préstamo ${prestamo._id}`);
        }
    } else {
      console.log(`📌 No se necesitan nuevos pagos para préstamo ${prestamo._id} (retrasos: ${cantidadRetrasos})`);
    }
};
