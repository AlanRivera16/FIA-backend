export function generarMensajeNotificacion({ type, data, from, to }) {
    switch (type) {
        case 'prestamo':
            // data: { monto, periodo }
            return `De $${data.monto?.toLocaleString('es-MX', {minimumFractionDigits:2})} a ${to?.nombre} diferido a ${data.periodo} ${data.periodo == 14 ? 'semanas' : 'meses'}`;
        case 'autorizacion':
            // data: { monto, periodo }
            return `De $${data.monto?.toLocaleString('es-MX', {minimumFractionDigits:2})} a ${to?.nombre} ha sido autorizado por el super usuario`;
        case 'pago':
            // data: { monto_pago, num_pago, monto_prestamo }
            return `De $${data.monto_pago?.toLocaleString('es-MX', {minimumFractionDigits:2})} correspondiente al pago #${data.num_pago}, préstamo de $${data.monto_prestamo?.toLocaleString('es-MX', {minimumFractionDigits:2})}`;
        case 'retraso':
            // data: { monto_prestamo }
            return `Cliente moroso, el préstamo se ha diferido a una semana más, préstamo $${data.monto_prestamo?.toLocaleString('es-MX', {minimumFractionDigits:2})}`;
        case 'asignacion':
            // data: { monto_prestamo }
            return `Se te ha asignado a ${data.clientesData.length == 1? data.clientesData[0].nombre + ' como tu nuevo cliente' : data.clientesData[0].nombre + ' y ' + (data.clientesData.length -1) + ' cliente(s) nuevo(s)'}`;
        default:
            return data?.mensaje || 'Tienes una nueva notificación';
    }
}