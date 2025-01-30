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
        default: 'No pagado' // 'Pagado' | 'Pendiente'
    },
    abono_pago: {
        type: Number,
        required:false
    },
    multa: {
        type: Number,
        required:false
    },
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
        default: 'Pendiente' // 'Aceptado' | 'Rechazado'
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
        required: true
    },
    id_cliente:{
        type: ObjectId,
        required: true
    },
    tabla_amortizacion:[subDoc],
    deleteStatus: {
        type: Boolean,
        default: false
    }
}, { timestamps:true});

export default mongoose.model("prestamos", PrestamoSchema)