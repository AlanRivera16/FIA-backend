import { ObjectId } from "mongodb";
import mongoose from "mongoose";

var subDoc = mongoose.Schema({
    _id:false,
    num_pago: {
        type: Number,
        required:true
    },
    fecha_pago: {
        type: Date,
        required:true
    },
    cuota:{
        type: Number,
        required:true
    },
    estado_pago:{
        type: String,
        default: 'No pagado' // 'Pagado' | 'Pendiente Bueno' | 'Pendiente Malo'
    },
    abono_pago: {
        type: Number,
        required:false
        // DESPUES DE PRESENTAR ESTO
        // Puede que se agregue el mismo esquema de detalle_retrasos o prestamos_detallados
        //$inc: { retrasos_totales: 1 }, // Incrementar el total de retrasos
        //$push: {
        //    detalles_retrasos: {
        //      id_prestamo: prestamo._id,
        //      num_pago: pago.num_pago,
        //      fecha_retraso: hoy
        //    }
        //  }
    },
    multa: {
        dia_retraso: { type: Number, default: 0 },
        monto_pendiente: { type: Number, default: 0 },
        saldado: { type: Boolean, default: false },
        fecha_pago: { type: Date, default: null },
        // required: false
    },
    aceptado: {
        type: Boolean,
        default: false,
        required: false
    },
    comprobantes: Array,
    notas: {
        type: String,
        required: false
    }
});

const PrestamoSchema = mongoose.Schema({
    fecha_prestamo: {
        type: Date,
        required: false
    },
    saldo:{
        type: Number,
        required:true
    },
    estado: {
        type: String,
        enum: ['Aceptado', 'Rechazado', 'Pendiente', 'Cerrado'],
        default: 'Pendiente' // 'Aceptado' | 'Rechazado' | 'Cerrado'
    },
    tipo_pago:{
        type: String,
        required:true
    },
    periodo: {
        type: Number,
        required: true
    },
    dia_pago: {
        type: String,
        required: false
    },
    id_asesor:{
        type: ObjectId,
        ref: 'usuarios',
        required: true
    },
    id_cliente:{
        type: ObjectId,
        ref: 'usuarios',
        required: true
    },
    tabla_amortizacion:[subDoc],
    deleteStatus: {
        type: Boolean,
        default: false
    },
    totalPagado: { type: Number, default: 0 },
    totalCuota: { type: Number, default: 0 },
    totalMultas: { type: Number, default: 0 },
    totalPendiente: { type: Number, default: 0 },
}, { timestamps:true});

export default mongoose.model("prestamos", PrestamoSchema)