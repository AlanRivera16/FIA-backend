import { Router } from "express";
import { getHistorial } from "../controllers/historial.controller.js"
const router = Router()

router.get('/historial', getHistorial);

export default router