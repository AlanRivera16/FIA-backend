import { Router } from "express";
import { deleteUsuario, getAsesores, getClientes, getUsuarios, postUsuario, putUsuario } from "../controllers/usuarios.controller.js"
import { loginUser } from "../controllers/authControllers.js";
const router = Router()

router.get('/usuarios', getUsuarios);
router.get('/usuarios/clientes', getClientes);
router.get('/usuarios/asesores', getAsesores);

router.post('/usuarios', postUsuario);

router.put('/usuario/:id', putUsuario);

router.patch('/delete/usuario/:id', deleteUsuario);

router.patch('/login', loginUser);

export default router

