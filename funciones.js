

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
