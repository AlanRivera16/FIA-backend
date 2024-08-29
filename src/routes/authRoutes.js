import express from 'express';
import { login, register } from '../controllers/authControllers.js';

const router = express.Router();

// Ruta para iniciar sesión
router.post('/login', login);
router.post('/register', register);

export default router;