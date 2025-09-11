import { Router } from "express";
import { getPrestamos, postPrestamo, putPrestamo, deletePrestamo, getPrestamoById, crearTabalAmortizacion, putTablaAmrPago, rechazarPrestamo, pagarMulta, cerrarPago, getPrestamosWithAsesor, getPrestamosByAsesor } from "../controllers/prestamos.controller.js"
const router = Router()

router.get('/prestamos', getPrestamos);

router.get('/prestamos_asesor', getPrestamosWithAsesor);

router.get('/prestamo_by_id/:_id', getPrestamoById)
router.get('/prestamos/asesor/:_id', getPrestamosByAsesor)

router.post('/prestamo', postPrestamo);

router.put('/prestamo/:_id', putPrestamo);

router.patch('/prestamo/pago/multa/:id_prestamo/:num_pago', pagarMulta);
router.patch('/rechazar/prestamo/:_id', rechazarPrestamo)
router.patch('/cerrar/prestamo/:_id', cerrarPago)
router.patch('/delete/prestamo/:_id', deletePrestamo);

//Endpoints para tabla de amortización 
router.patch('/crear_tabla/:_id', crearTabalAmortizacion)
router.patch('/update_tabla/pago/:_id', putTablaAmrPago)
export default router

