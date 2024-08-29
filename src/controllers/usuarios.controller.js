import Usuario from "../models/usuario.model.js"

export const getUsuarios = async (req, res) => {
    try {
        const usuario = await Usuario.find({ deleteStatus:false });
        res.send(usuario);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const postUsuario = async (req, res) => {
    // const {nombre, apellidos} = req.body
    try {
      
      const usuario = new Usuario({
        nombre: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        saldo_asignado: req.body.saldo_asignado,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
      });

      const usuarioSaved = await usuario.save();
      res.json(usuarioSaved);

    } catch (error) {
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