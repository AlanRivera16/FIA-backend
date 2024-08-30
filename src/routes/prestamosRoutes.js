import { Router } from "express";
import { getPrestamos, postPrestamo, putPrestamo } from "../controllers/prestamos.controller.js"
const router = Router()

router.get('/prestamo', getPrestamos);

router.post('/prestamo', postPrestamo);

router.put('/prestamo/:id', putPrestamo);

router.patch('/delete/prestamo/:id', deletePrestamo);

export default router

