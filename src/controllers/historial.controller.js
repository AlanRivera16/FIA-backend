import Historial from '../models/historial.model.js';

export const getHistorial = async (req, res) => {
    try {
        const historial = await Historial.find();
        res.send(historial);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const getHistorialById = async (req, res) => {
    try {
        const historial = await Historial.findById(req.params.id);
        res.send(historial);
    } catch (error) {
        res.status(500).send
    }
}

export const getHistorialByUserId = async (req, res) => {
    try {
        const historial = await Historial.findOne({ id_usuario: req.params.id });
        res.send(historial);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const postHistorial =  async (req, res) => {
    try {

        const historial = new Historial({
            id_usuario: req.body.id_usuario,
        });

        const historialSaved = await historial.save();
        res.json(historialSaved);

    } catch (error) {
        res.status(500).send(error);
    }
}

// export const registrarRetraso = async (idUsuario, idPrestamo, numPago, diasRetraso) => {
export const registrarRetraso = async (req, res) => {
    await Historial.updateOne(
        { id_usuario: req.params.id },
        {
            $inc: { retrasos_totales: 1 },
            $push: {
                detalles_retrasos: {
                    id_prestamo: req.body.idPrestamo,
                    num_pago: req.body.numPago,
                    fecha_retraso: new Date(),
                    // dias_retraso: diasRetraso,
                    // multa: multa
                }
            }
        }
    );
}
