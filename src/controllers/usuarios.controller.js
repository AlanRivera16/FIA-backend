import mongoose from "mongoose";
import Usuario from "../models/usuario.model.js"
import Historial from "../models/historial.model.js"

export const getUsuarios = async (req, res) => {
    try {
        const usuario = await Usuario.find({ deleteStatus:false });
        res.send(usuario);
    } catch (error) {
        res.status(500).send(error);
    }
}
export const getClientes = async (req, res) => {
    try {
        const usuario = await Usuario.find({ 
            deleteStatus:false,
            role: "CLIENTE"
        });
        res.send(usuario);
    } catch (error) {
        res.status(500).send(error);
    }
}
export const getAsesores = async (req, res) => {
    try {
        const usuario = await Usuario.find({ 
            deleteStatus:false,
            role: "ASESOR"
        });
        res.send(usuario);
    } catch (error) {
        res.status(500).send(error);
    }
}
export const getClients = async (req, res) => {
    try {
        const usuario = await Usuario.find({ 
            deleteStatus:false,
            role: "CLIENTE"
        });
        res.send(usuario);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const postUsuario = async (req, res) => {
    const session = await mongoose.startSession(); // Iniciar sesión de transacción
    session.startTransaction(); // Iniciar transacción

    try {
    //   const historial = 

      const usuario = await Usuario.create([{
        nombre: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        saldo_asignado: req.body.saldo_asignado,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
      }], {session});
      console.log('User created: ',usuario)

    //   const usuario = new Usuario({
    //     nombre: req.body.nombre,
    //     email: req.body.email,
    //     password: req.body.password,
    //     role: req.body.role,
    //     saldo_asignado: req.body.saldo_asignado,
    //     telefono: req.body.telefono,
    //     direccion: req.body.direccion,
    //   });
      
      const historial = await Historial.create([{
        id_usuario: usuario[0]._id,
      }], { session });
      console.log('History created: ',historial)

      await Usuario.updateOne(
        { _id: usuario[0]._id },
        { $set: { id_historial: historial[0]._id } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

    //   const usuarioSaved = await usuario.save();
    //   res.json(usuarioSaved);
      res.json({ usuario: usuario[0] , historial: historial[0] });

    } catch (error) {
      await session.abortTransaction(); // Revertir cambios si hay error
      session.endSession();
      res.status(500).send(error);
    }
}

export const putUsuario = async (req, res) => {
    try {
        const updateUsuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        res.json(updateUsuario);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const deleteUsuario = async (req, res) => {
    try {
        const deletedUsuario = await Usuario.findByIdAndUpdate(req.params.id, {
            deleteStatus: true
        });
        res.json(deletedUsuario);
    } catch (error) {
        res.status(500).send(error);
    }
}