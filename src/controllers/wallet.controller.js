// src/controllers/wallet.controller.js
import Wallet from '../models/wallet.model.js';
//import { Parser } from 'json2csv';

export const getWalletInfo = async (req, res) => {
  try {
    const { owner } = req.params;
    const wallet = await Wallet.findOne({ owner }).populate('movimientos.id_prestamo movimientos.id_cliente movimientos.id_asesor');
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener wallet', error: error.message });
  }
};

export const crearWalletSuperUsuario = async (req, res) => {
  try {
    const { owner, saldoInicial } = req.body;
    const wallet = new Wallet({ owner, saldo: saldoInicial || 0 });
    await wallet.save();
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear wallet', error: error.message });
  }
};

export const setEstadoWallet = async (req, res) => {
  try {
    const { owner } = req.params;
    const { activa } = req.body;
    const wallet = await Wallet.findOneAndUpdate(
      { owner },
      { activa },
      { new: true }
    );
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado de la wallet', error: error.message });
  }
};

export const registrarMovimiento = async (req, res) => {
  try {
    const { owner, tipo, monto, descripcion, id_prestamo, id_cliente, id_asesor, multa, interes } = req.body;
    const wallet = await Wallet.findOne({ owner });
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    // Actualiza saldo
    wallet.saldo += (tipo === 'ingreso' ? monto : -monto);

    // Agrega movimiento
    wallet.movimientos.push({ tipo, monto, descripcion, id_prestamo, id_cliente, id_asesor, multa, interes });

    await wallet.save();
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar movimiento', error: error.message });
  }
};

export const depositarWallet = async (req, res) => {
  try {
    const { owner } = req.params;
    const { monto, descripcion } = req.body;
    if (monto <= 0) return res.status(400).json({ message: 'El monto debe ser mayor a cero.' });

    const wallet = await Wallet.findOneAndUpdate(
      { owner },
      {
        $inc: { saldo: monto },
        $push: {
          movimientos: {
            tipo: 'ingreso',
            monto,
            descripcion: descripcion || 'Depósito manual'
          }
        }
      },
      { new: true }
    );
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al depositar en la wallet', error: error.message });
  }
};

export const retirarWallet = async (req, res) => {
  try {
    const { owner } = req.params;
    const { monto, descripcion } = req.body;
    if (monto <= 0) return res.status(400).json({ message: 'El monto debe ser mayor a cero.' });

    const wallet = await Wallet.findOne({ owner });
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
    if (wallet.saldo < monto) return res.status(400).json({ message: 'Saldo insuficiente.' });

    wallet.saldo -= monto;
    wallet.movimientos.push({
      tipo: 'egreso',
      monto,
      descripcion: descripcion || 'Retiro manual'
    });
    await wallet.save();
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al retirar de la wallet', error: error.message });
  }
};

export const exportarMovimientos = async (req, res) => {
  try {
    const { owner } = req.params;
    const wallet = await Wallet.findOne({ owner });
    const parser = new Parser();
    const csv = parser.parse(wallet.movimientos);
    res.header('Content-Type', 'text/csv');
    res.attachment('movimientos.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error al exportar movimientos', error: error.message });
  }
};