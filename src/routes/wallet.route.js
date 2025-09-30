import { Router } from "express";
import {crearWalletSuperUsuario, depositarWallet, editarConfiguracionWallet, eliminarMovimientoGuardado, getWalletConfig, getWalletInfo, guardarMovimiento, obtenerDatosMovimientosGuardados, obtenerMovimientoPorId, obtenerMovimientos, obtenerMovimientosGuardados, registrarMovimiento, retirarWallet, setEstadoWallet} from "../controllers/wallet.controller.js"
const router = Router()

router.get('/wallet/:owner', getWalletInfo);

// Nueva ruta para movimientos paginados y filtrados
router.get('/wallet/:owner/movimientos', obtenerMovimientos);
router.get('/wallet/movimiento/:id', obtenerMovimientoPorId);
router.get('/wallet/:owner/movimientos-guardados', obtenerMovimientosGuardados);
router.get('/wallet/:owner/datos-movimientos-guardados', obtenerDatosMovimientosGuardados);
router.get('/wallet/:owner/config', getWalletConfig);

router.post('/wallet/iniciar-wallet', crearWalletSuperUsuario)
router.post('/wallet/add-movimiento', registrarMovimiento)
router.post('/wallet/:owner/depositar', depositarWallet);
router.post('/wallet/:owner/retirar', retirarWallet);
router.post('/wallet/:owner/guardar-movimiento', guardarMovimiento);

router.put('/wallet/:owner/estado', setEstadoWallet);
router.patch('/wallet/:owner/configuracion', editarConfiguracionWallet);

router.delete('/wallet/:owner/eliminar-movimiento-guardado', eliminarMovimientoGuardado);

export default router