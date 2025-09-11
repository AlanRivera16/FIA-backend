import mongoose from "mongoose";

const NotificacionSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['prestamo', 'pago', 'retraso', 'sistema', 'otro'],
        required: true
    },
    userId: { // Usuario que recibe la notificación
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios',
        required: true
    },
    from: { // Opcional: quien la envía (puede ser null si es del sistema)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios',
        required: false
    },
    mensaje: {
        type: String,
        required: true
    },
    data: { // Información adicional (id_prestamo, monto, etc.)
        type: Object,
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model("notificaciones", NotificacionSchema)