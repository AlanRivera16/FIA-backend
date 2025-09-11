import Notificacion from '../models/notificaciones.model.js';

// Crear una nueva notificación
export const crearNotificacion = async (req, res) => {
    try {
        const notificacion = new Notificacion(req.body);
        await notificacion.save();
        res.status(201).json(notificacion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener notificaciones de un usuario
export const obtenerNotificacionesPorUsuario = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [notificaciones, total] = await Promise.all([
            Notificacion.find({ userId })
                .populate('from', 'nombre evidencia_aval role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notificacion.countDocuments({ userId })
        ]);

        res.json({
            notificaciones,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const contarNoLeidasPorUsuario = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await Notificacion.countDocuments({ userId, isRead: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const notificacion = await Notificacion.findByIdAndUpdate(id, { isRead: true }, { new: true });
        res.json(notificacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Marcar todas como leídas para un usuario
export const marcarTodasComoLeidas = async (req, res) => {
    try {
        const { userId } = req.params;
        await Notificacion.updateMany({ userId, isRead: false }, { isRead: true });
        res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};