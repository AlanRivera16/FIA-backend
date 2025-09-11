import { Router } from "express";
import { crearNotificacion, obtenerNotificacionesPorUsuario, marcarComoLeida, marcarTodasComoLeidas, contarNoLeidasPorUsuario} from '../controllers/notificaciones.controller.js';

const router = Router()

router.post('/notificacion', crearNotificacion);
router.get('/notificacion/:userId', obtenerNotificacionesPorUsuario);
router.get('/notificacion/no-leidas/:userId', contarNoLeidasPorUsuario);
router.patch('/notificacion/leida/:id', marcarComoLeida);
router.patch('/notificacion/leidas/:userId', marcarTodasComoLeidas);

export default router;