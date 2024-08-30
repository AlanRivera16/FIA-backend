import Prestamo from "../models/prestamo.model"

export const getPrestamos = async (req, res) => {
    try {
        const prestamo = await Prestamo.find({ status:false });
        res.send(prestamo);
    } catch (err) {
        res.status(500).send(err);
    }
}

export const postPrestamo = async (req, res) => {
    try {
      
      const prestamo = new Usuario({
        fechaPrestamoISO: req.body.fechaPrestamoISO,
        montoSolicitado: req.body.montoSolicitado,
        esquemaPago: req.body.esquemaPago,
        pagoAcordado: req.body.pagoAcordado,
        colaboradorAsignado: req.body.colaboradorAsignado,
        diaCobro: req.body.diaCobro,
      });

      const prestamoSaved = await prestamo.save();
      res.json(prestamoSaved);

    } catch (err) {
      res.status(500).send(err);
    }
}

export const putPrestamo = async (req, res) => {
    try {
        const updatePrestamo = await Prestamo.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        res.json(updatePrestamo);
    } catch (err) {
        res.status(500).send(err);
    }
}

export const deletePrestamo = async (req, res) => {
    try {
        const deletedUsuario = await Prestamo.findByIdAndUpdate(req.params.id, {
            status: true
        });
        res.json(deletedUsuario);
    } catch (error) {
        res.status(500).send(error);
    }
}