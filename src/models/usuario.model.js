import { ObjectId } from "mongodb";
import mongoose, { Types } from "mongoose";

var evidenciaAval = mongoose.Schema({
    _id:false,
    nombre_aval: {
        type: String,
        required: false
    },
    telefono_aval: {
        type: Number,
        required: false
    },
    email_aval: {
        type: String,
        required: false
    },
    direccion_aval: {
        type: String,
        required: false
    },
    evidencia_fotos: Array,
});

const UserSchema = mongoose.Schema({
    nombre:{
        type: String,
        required:true
    },
    curp:{
        type: String,
        required: false,
        unique:true
    },
    email:{
        type: String,
        unique: true,
        required:true
    },
    password: {
        type: String,
        required: false
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
            required: false
        },
        email_aval: {
            type: String,
            unique: true,
            required: false
        },
        telefono_aval: {
            type: Number,
            require: false
        },
        direccion_aval: {
            type: String,
            require: false
        },
        evidencia_aval: Array,
    },
    evidencia_aval: Array,
    garantias: {
        type: Array,
        require: false
    }
    //evidencia: evidenciaAval,
}, { timestamps:true});

export default mongoose.model("usuarios", UserSchema)