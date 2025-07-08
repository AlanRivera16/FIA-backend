import mongoose from "mongoose";
import Usuario from "../models/usuario.model.js"
import Historial from "../models/historial.model.js"
import {removeImage, uploadImage} from "../utils/cloudinary.js"
import fs from 'fs-extra'

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
export const getClientesById = async (req, res) => {
    try {
        const clientes = await Usuario.find({ 
            deleteStatus:false,
            assigned_to: req.params
        });
        res.send(clientes);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const postUsuario = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Reconstruir aval_info desde el body
        const aval_info = {
            nombre_aval: req.body.nombre_aval,
            email_aval: req.body.email_aval,
            telefono_aval: req.body.telefono_aval,
            direccion_aval: req.body.direccion_aval,
            evidencia_aval: [] // se llenará abajo si hay imágenes
        };

        // 2. Crea el usuario con el body y aval_info reconstruido
        const usuario = new Usuario({
            ...req.body,
            aval_info
        });

        // 3. Manejo de imágenes principales
        let imageResults = [];
        if (req.files?.image) {
            const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
            imageResults = await Promise.all(
                files.map(async (file) => {
                    const result = await uploadImage(file.tempFilePath);
                    await fs.unlink(file.tempFilePath)
                    return {
                        url: result.secure_url,
                        public_id: result.public_id,
                        originalname: file.name
                    };
                })
            );
            usuario.evidencia_aval = imageResults;
        }

        // 4. Manejo de imágenes de aval_info
        let imageAvalResults = [];
        if (req.files?.image_aval) {
            const files = Array.isArray(req.files.image_aval) ? req.files.image_aval : [req.files.image_aval];
            imageAvalResults = await Promise.all(
                files.map(async (file) => {
                    const result = await uploadImage(file.tempFilePath);
                    await fs.unlink(file.tempFilePath)
                    return {
                        url: result.secure_url,
                        public_id: result.public_id,
                        originalname: file.name
                    };
                })
            );
            usuario.aval_info.evidencia_aval = imageAvalResults;
        }

        // 5. Guarda el usuario en la base de datos
        await usuario.save({ session });

        // 6. Crea el historial
        const historial = new Historial({ id_usuario: usuario._id });
        await historial.save({ session });

        await Usuario.updateOne(
            { _id: usuario._id },
            { $set: { id_historial: historial._id } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Usuario creado correctamente',
            usuario
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        // Imprime el error completo para debug
        console.error('Error en postUsuario:', error);
        res.status(500).json({ message: 'Error al crear usuario', error: error.message, stack: error.stack });
    }
}

export const uploadIMAGEN = async (req, res) => {
    try {
        // const imagenes = [req.files]
        // console.log(imagenes)

      let imageResults = [];
      if(req.files?.image){
          const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
            //console.log(files)
          // Subir todas las imágenes a Cloudinary
          imageResults = await Promise.all(
              files.map(async (file) => {
                  const result = await uploadImage(file.tempFilePath);
                  await fs.unlink(file.tempFilePath)
                  return {
                      url: result.secure_url,
                      public_id: result.public_id,
                      originalname: file.name
                  };
              })
          );
    //    const result = await uploadImage(req.files.image.tempFilePath)
       //console.log(imageResults)
      }

      //await fs.unlink(req.files.image.tempFilePath)

      res.json({message: "OKAY", imagenes: imageResults})
    } catch (error) {
        
    }
}

export const putUsuario = async (req, res) => {
    try {
    // Busca el usuario actual
    const usuario = await Usuario.findById(req.params);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // Reconstruir aval_info desde req.body
    const aval_info = {
      nombre_aval: req.body.nombre_aval,
      email_aval: req.body.email_aval,
      telefono_aval: req.body.telefono_aval,
      direccion_aval: req.body.direccion_aval,
      evidencia_aval: usuario.aval_info?.evidencia_aval || []
    };

    // Actualiza los campos simples
    Object.assign(usuario, req.body);

    usuario.aval_info = aval_info

    // 3. Manejo de imágenes principales
    if (req.files?.image) {
      const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
      for (const file of files) {
        // Busca si ya existe una imagen con ese nombre
        const idx = usuario.evidencia_aval.findIndex(img => img.originalname === file.name);
        if (idx > -1) {
          // Elimina la imagen anterior de Cloudinary
          const public_id = usuario.evidencia_aval[idx].public_id;
          if (public_id) await removeImage(public_id);
          // Sube la nueva imagen y reemplaza
          const result = await uploadImage(file.tempFilePath);
          await fs.unlink(file.tempFilePath);
          usuario.evidencia_aval[idx] = {
            url: result.secure_url,
            public_id: result.public_id,
            originalname: file.name
          };
        } else {
          // Sube la nueva imagen y agrega
          const result = await uploadImage(file.tempFilePath);
          await fs.unlink(file.tempFilePath);
          usuario.evidencia_aval.push({
            url: result.secure_url,
            public_id: result.public_id,
            originalname: file.name
          });
        }
      }
    }

    // 4. Manejo de imágenes de aval_info
    if (req.files?.image_aval) {
      // Asegúrate de que aval_info y evidencia_aval existen
      if (!usuario.aval_info) usuario.aval_info = {};
      if (!usuario.aval_info.evidencia_aval) usuario.aval_info.evidencia_aval = [];

      const files = Array.isArray(req.files.image_aval) ? req.files.image_aval : [req.files.image_aval];
      for (const file of files) {
        const idx = usuario.aval_info.evidencia_aval.findIndex(img => img.originalname === file.name);
        if (idx > -1) {
          const public_id = usuario.aval_info.evidencia_aval[idx].public_id;
          if (public_id) await removeImage(public_id);
          const result = await uploadImage(file.tempFilePath);
          await fs.unlink(file.tempFilePath);
          usuario.aval_info.evidencia_aval[idx] = {
            url: result.secure_url,
            public_id: result.public_id,
            originalname: file.name
          };
        } else {
          const result = await uploadImage(file.tempFilePath);
          await fs.unlink(file.tempFilePath);
          usuario.aval_info.evidencia_aval.push({
            url: result.secure_url,
            public_id: result.public_id,
            originalname: file.name
          });
        }
      }
    }
    console.log(usuario)

    // 5. Guarda los cambios
    await usuario.save();

    res.json({ message: "Usuario actualizado correctamente", usuario });
  } catch (error) {
    console.error("Error en putUsuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
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