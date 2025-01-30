import Historial from '../models/historial.model.js';

export const getHistorial = async (req, res) => {
    try {
        const historial = await Historial.find();
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

async function registrarRetraso(idUsuario, idPrestamo, numPago, diasRetraso, multa = 0) {
    await Historial.updateOne(
        { id_usuario: idUsuario },
        {
            $inc: { retrasos_totales: 1 },
            $push: {
                detalles_retrasos: {
                    id_prestamo: idPrestamo,
                    num_pago: numPago,
                    fecha_retraso: new Date(),
                    dias_retraso: diasRetraso,
                    multa: multa
                }
            }
        }
    );
}
