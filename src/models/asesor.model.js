import mongoose from "mongoose";

const AsesorSchema = mongoose.Schema({
    fotoAsesor:{
        type: String,
        required:true
    },
    nombre:{
        type: String,
        required:true
    },
    email:{
        type: String,
        unique: true,
        required:true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true
    },
    deleteStatus: {
        type: Boolean,
        default: false
    },
    saldo_asignado: Number,
    telefono: Number,
    direccion: String,
    evidencia: Array,
    identificacion: Array,
}, { timestamps:true});

export default mongoose.model("Asesor", AsesorSchema)