import { Router } from "express";
import { getHistorial, getHistorialById, getHistorialByUserId } from "../controllers/historial.controller.js"
const router = Router()

router.get('/historial', getHistorial);
router.get('/historial/:id', getHistorialById);
router.get('/historial/user/:id', getHistorialByUserId);

export default router