import { ObjectId } from "mongodb";
import mongoose, { Types } from "mongoose";

var evidenciaAval = mongoose.Schema({
    _id:false,
    nombre_aval: {
        type: String,
        required: true
    },
    telefono_aval: {
        type: Number,
        required: true
    },
    email_aval: {
        type: String,
        required: true
    },
    direccion_aval: {
        type: String,
        required: true
    },
    evidencia_fotos: Array,
});

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
    aval_info: {
        nombre_aval: {
            type: String,
            required: true
        },
        email_aval: {
            type: String,
            unique: true,
            required: true
        },
        telefono_aval: {
            type: Number,
            require: true
        },
        direccion_aval: {
            type: String,
            require: true
        },
        evidencia_aval: Array
    },
    evidencia_aval: Array
    //evidencia: evidenciaAval,
}, { timestamps:true});

export default mongoose.model("usuarios", UserSchema)