import { Router } from "express";
import { asignarAsesorAClientes, deleteUsuario, getAsesores, getClientes, getClientesBaja, getClientesByIdAssigned, getClientesNoAssigned, getUsuarios, postUsuario, putUsuario, uploadIMAGEN } from "../controllers/usuarios.controller.js"
import { loginUser } from "../controllers/authControllers.js";
const router = Router()

router.get('/usuarios', getUsuarios);
router.get('/usuarios/clientes', getClientes);
router.get('/usuarios/clientes/:_id', getClientesByIdAssigned);
router.get('/usuarios/asesores', getAsesores);
router.get('/usuarios/no-asignados', getClientesNoAssigned);
router.get('/usuarios/baja', getClientesBaja);

router.post('/usuarios', postUsuario);
router.post('/usuarios/img', uploadIMAGEN);

router.put('/usuarios/:_id', putUsuario);

router.delete('/delete/usuario/:id', deleteUsuario);

router.patch('/login', loginUser);
router.patch('/usuarios/asignar-asesor', asignarAsesorAClientes);

export default router

