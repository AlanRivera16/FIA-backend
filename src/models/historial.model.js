import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const HistorialSchema = mongoose.Schema({
    id_usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Relación con la colección User
        required: true,
        unique: true // Un historial por usuario
    },
    prestamos_totales: {
        type: Number,
        default: 0, // Número total de préstamos otorgados
    },
    prestamos_activos: {
        type: Number,
        default: 0, // Número de préstamos activos
    },
    prestamos_finalizados: {
        type: Number,
        default: 0, // Número de préstamos completamente pagados
    },
    retrasos_totales: {
        type: Number,
        default: 0, // Número total de pagos retrasados
    },
    estado_general: {
        type: String,
        enum: ['Excelente', 'Bueno', 'Regular', 'Malo'], // Basado en métricas como retrasos, pagos, etc.
        default: 'Bueno'
    },
    detalles_retrasos: [ // Registro de pagos atrasados para análisis detallado
        {   
            _id: false,
            id_prestamo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Prestamo', // Relación con la colección Prestamos
                required: true
            },
            num_pago: {
                type: Number, // Número del pago atrasado
                required: true
            },
            fecha_retraso: {
                type: Date, // Fecha del retraso
                required: true
            },
            // dias_retraso: { //PUEDE NO SERVIR 
            //     type: Number, // Número de días de retraso
            //     required: true
            // },
            // multa: { //PUEDE NO SERVIR 
            //     type: Number, // Monto de la multa por el retraso
            //     required: false
            // }
        }
    ],
    prestamos_detallados: [ // Lista simplificada de préstamos
        {
            _id: false,
            id_prestamo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Prestamo',
                required: true
            },
            saldo_pendiente: { //(-Deuda total- from Prestamos page modal prestamo/segment Actividad)
                type: Number, // Saldo que aún debe el cliente
                required: true
            },
            multas_pendientes: {
                type: Number,
                require: true
            },
            pagos_pendientes: {
                type: Number,
                require: true
            },
            total_pagado: {
                type: Number,
                require: true
            },
            // pagos_pendientes: {
            //     type: Number,
            //     require: true
            // },
            estado: {
                type: String, // Estado actual del préstamo (Pendiente, Aceptado, Rechazado)
                required: true
            },
            fecha_inicio: {
                type: Date, // Fecha de inicio del préstamo
                required: true
            },
            fecha_finalizacion: {
                type: Date, // Fecha estimada de finalización
                required: false
            }
        }
    ],
    // Otras métricas útiles para el historial
    monto_total_prestado: {
        type: Number,
        default: 0 // Monto total prestado al cliente
    },
    monto_total_pagado: {
        type: Number,
        default: 0 // Monto total que el cliente ha pagado
    },
    monto_total_pendiente: {
        type: Number,
        default: 0 // Monto que el cliente aún debe
    },
    // Timestamp para registro de creación y actualizaciones
}, { timestamps: true });

export default mongoose.model("historial", HistorialSchema)