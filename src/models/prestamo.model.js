import mongoose from "mongoose";

const PrestamoSchema = mongoose.Schema({
    fechaPrestamoISO:{
        type: Date,
        required:true
    },
    montoSolicitado:{
        type: Number,
        required:true
    },
    esquemaPago:{
        type: String,
        required:true
    },
    pagoAcordado:{
        type: Number,
        required:true
    },
    colaboradorAsignado: {
        type: mongoose.Schema.ObjectId,
        ref: 'usuarios',
        required: 'Campo id colaborador es requerido.'
    },
    diaCobro:{
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    }
}, { timestamps:true});

export default mongoose.model("prestamos", PrestamoSchema)