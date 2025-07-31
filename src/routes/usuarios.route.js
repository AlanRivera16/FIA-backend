import { Router } from "express";
import { deleteUsuario, getAsesores, getClientes, getClientesByIdAssigned, getUsuarios, postUsuario, putUsuario, uploadIMAGEN } from "../controllers/usuarios.controller.js"
import { loginUser } from "../controllers/authControllers.js";
const router = Router()

router.get('/usuarios', getUsuarios);
router.get('/usuarios/clientes', getClientes);
router.get('/usuarios/clientes/:_id', getClientesByIdAssigned);
router.get('/usuarios/asesores', getAsesores);

router.post('/usuarios', postUsuario);
router.post('/usuarios/img', uploadIMAGEN);

router.put('/usuarios/:_id', putUsuario);

router.patch('/delete/usuario/:id', deleteUsuario);

router.patch('/login', loginUser);

export default router

