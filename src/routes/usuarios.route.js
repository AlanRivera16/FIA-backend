import { Router } from "express";
import { asignarAsesorAClientes, deleteGarantiasImages, deleteUsuario, getAsesores, getClientes, getClientesBaja, getClientesByIdAssigned, getClientesNoAssigned, getSaldoUsuario, getUsuarios, postUsuario, putUsuario, uploadGarantiasImages, uploadIMAGEN } from "../controllers/usuarios.controller.js"
import { loginUser } from "../controllers/authControllers.js";
const router = Router()

router.get('/usuarios', getUsuarios);
router.get('/usuarios/clientes', getClientes);
router.get('/usuarios/clientes/:_id', getClientesByIdAssigned);
router.get('/usuarios/asesores', getAsesores);
router.get('/usuarios/no-asignados', getClientesNoAssigned);
router.get('/usuarios/baja', getClientesBaja);
router.get('/usuarios/:id/saldo', getSaldoUsuario);

router.post('/usuarios', postUsuario);
router.post('/usuarios/img', uploadIMAGEN);

router.put('/usuarios/:_id', putUsuario);

router.delete('/delete/usuario/:id', deleteUsuario);

router.patch('/login', loginUser);
router.patch('/usuarios/asignar-asesor', asignarAsesorAClientes);

//IMAGES
router.post('/usuarios/:_id/garantias', uploadGarantiasImages); // subir imágenes
router.patch('/usuarios/:_id/garantias', deleteGarantiasImages); // borrar imágenes

export default router

