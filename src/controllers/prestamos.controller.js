import Prestamo from "../models/prestamo.model"

export const getPrestamos = async (req, res) => {
    try {
        const prestamo = await Prestamo.find({ deleteStatus:false });
        res.send(prestamo);
    } catch (error) {
        res.status(500).send(error);
    }
}