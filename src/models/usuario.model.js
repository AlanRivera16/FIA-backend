import mongoose from "mongoose";

// var dataSchema = mongoose.Schema({
//     nombre:{
//         type: String
//     },
//     telefono:{
//         type: Number
//     },
//     correo:{
//         type: String
//     }
// },{_id: false});

const UserSchema = mongoose.Schema({
    foto: {
        type: String,
        required: false
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
    asesorId: {
        type: mongoose.Schema.ObjectId,
        ref: 'usuarios',
        required: false
    },
    clientes: [{
        id: {
            type: mongoose.Schema.ObjectId,
            ref: 'usuarios',
            required: false
        }
    }]
}, { timestamps:true});

export default mongoose.model("usuarios", UserSchema)