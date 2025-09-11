import { Router } from "express";
import {crearWalletSuperUsuario, depositarWallet, getWalletInfo, registrarMovimiento, retirarWallet, setEstadoWallet} from "../controllers/wallet.controller.js"
const router = Router()

router.get('/wallet/:owner', getWalletInfo);

router.post('/wallet/iniciar-wallet', crearWalletSuperUsuario)
router.post('/wallet/add-movimiento', registrarMovimiento)
router.post('/wallet/:owner/depositar', depositarWallet);
router.post('/wallet/:owner/retirar', retirarWallet);

router.put('/wallet/:owner/estado', setEstadoWallet);


export default router