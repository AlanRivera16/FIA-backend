import { ObjectId } from "mongodb";
import mongoose, { Types } from "mongoose";

const UserSchema = mongoose.Schema({
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
    saldo_asignado: {
        type: Number,
        require: false
    },
    telefono: {
        type: Number,
        require: true
    },
    direccion: {
        type: String,
        require: true
    },
    id_historial: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'historial',
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    assigned_to:{
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    evidencia: Array,
}, { timestamps:true});

export default mongoose.model("usuarios", UserSchema)