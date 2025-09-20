import { Router } from "express";
import { getPrestamos, postPrestamo, putPrestamo, deletePrestamo, getPrestamoById, crearTablaAmortizacion, putTablaAmrPago, rechazarPrestamo, pagarMulta, getPrestamosWithAsesor, getPrestamosByAsesor, cerrarPrestamo, uploadComprobantesPagoImages, deleteComprobantesPagoImages, aceptarPagoPrestamo } from "../controllers/prestamos.controller.js"
const router = Router()

router.get('/prestamos', getPrestamos);

router.get('/prestamos_asesor', getPrestamosWithAsesor);

router.get('/prestamo_by_id/:_id', getPrestamoById)
router.get('/prestamos/asesor/:_id', getPrestamosByAsesor)

router.post('/prestamo', postPrestamo);

//Aceptar pago de prestamo
router.patch('/prestamo/aceptar-pago/:id_prestamo/:num_pago', aceptarPagoPrestamo);


router.put('/prestamo/:_id', putPrestamo);

router.patch('/prestamo/pago/multa/:id_prestamo/:num_pago', pagarMulta);
router.patch('/rechazar/prestamo/:_id', rechazarPrestamo)
router.patch('/cerrar/prestamo/:_id', cerrarPrestamo)
router.patch('/delete/prestamo/:_id', deletePrestamo);

//Endpoints para tabla de amortización 
router.patch('/crear_tabla/:_id', crearTablaAmortizacion)
router.patch('/update_tabla/pago/:_id', putTablaAmrPago)
router.post('/prestamo/comprobantes/:_id', uploadComprobantesPagoImages);
router.patch('/prestamo/comprobantes/:_id', deleteComprobantesPagoImages);

export default router

