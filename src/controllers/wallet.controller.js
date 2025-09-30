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

export const obtenerMovimientos = async (req, res) => {
  try {
    const { owner } = req.params;
    let { fechaInicio, fechaFin, tipo, page = 1, limit = 5 } = req.query;
    const skip = (page - 1) * limit;

    // Procesa tipos múltiples
    let tipos = [];
    if (tipo) {
      if (Array.isArray(tipo)) {
        tipos = tipo;
      } else if (typeof tipo === 'string') {
        tipos = tipo.split(',').map(t => t.trim());
      }
    }

    // Busca la wallet y filtra los movimientos
    const wallet = await Wallet.findOne({ owner }).populate('movimientos.id_prestamo movimientos.id_cliente movimientos.id_asesor');
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    let movimientos = wallet.movimientos.filter(mov => {
      let valido = true;
      // Fecha inicio
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        valido = valido && new Date(mov.fecha) >= inicio;
      }
      // Fecha fin (incluye todo el día)
      if (fechaFin) {
        // Si fechaFin viene como 'YYYY-MM-DD', asegúrate de crear la fecha en UTC al final del día
        // Ejemplo: '2025-08-21' => '2025-08-21T23:59:59.999Z'
        let fin;
        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
          fin = new Date(fechaFin + 'T23:59:59.999Z');
        } else {
          fin = new Date(fechaFin);
          fin.setUTCHours(23, 59, 59, 999);
        }
        valido = valido && new Date(mov.fecha) <= fin;
      }
      // Tipo múltiple
      if (tipos.length > 0) {
        valido = valido && tipos.includes(mov.tipo);
      }
      return valido;
    });

    // Ordena y pagina
    movimientos = movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const total = movimientos.length;
    const paginados = movimientos.slice(skip, skip + parseInt(limit));

    res.json({
      movimientos: paginados,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimientos', error: error.message });
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

/// GUARDADOS
export const obtenerMovimientosGuardados = async (req, res) => {
  try {
    const { owner } = req.params;
    const wallet = await Wallet.findOne({ owner });
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    // Busca los movimientos por ID en el array guardados
    const movimientosGuardados = wallet.movimientos.filter(mov =>
      wallet.guardados.includes(mov._id.toString())
    );

    // Ordena según el array guardados (último guardado primero)
    const ordenados = wallet.guardados.map(id =>
      movimientosGuardados.find(mov => mov._id.toString() === id)
    ).filter(Boolean);

    res.json({ guardados: ordenados });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimientos guardados', error: error.message });
  }
};
export const obtenerDatosMovimientosGuardados = async (req, res) => {
  try {
    const { owner } = req.params;
    const wallet = await Wallet.findOne({ owner }).populate('movimientos.id_prestamo movimientos.id_cliente movimientos.id_asesor');
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    // Obtiene los movimientos completos usando los IDs guardados
    const movimientosGuardados = wallet.guardados
      .map(id => wallet.movimientos.find(mov => mov._id.toString() === id))
      .filter(Boolean);

    res.json({ movimientos: movimientosGuardados });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos de movimientos guardados', error: error.message });
  }
};

// wallet.controller.js
export const obtenerMovimientoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await Wallet.findOne({ 'movimientos._id': id }).populate('movimientos.id_prestamo movimientos.id_cliente movimientos.id_asesor');
    if (!wallet) return res.status(404).json({ message: 'Movimiento no encontrado' });
    const movimiento = wallet.movimientos.find(mov => mov._id.toString() === id);
    if (!movimiento) return res.status(404).json({ message: 'Movimiento no encontrado' });
    res.json(movimiento);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimiento', error: error.message });
  }
};

export const guardarMovimiento = async (req, res) => {
  try {
    const { owner } = req.params;
    const { movimientoId } = req.body;

    const wallet = await Wallet.findOne({ owner });
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    // Verifica si ya está guardado
    if (wallet.guardados.includes(movimientoId)) {
      return res.status(400).json({ message: 'El movimiento ya está guardado.' });
    }

    // Inserta al inicio del array (último guardado primero)
    wallet.guardados.unshift(movimientoId);
    await wallet.save();
    res.json({ guardados: wallet.guardados });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar movimiento', error: error.message });
  }
};

export const eliminarMovimientoGuardado = async (req, res) => {
  try {
    const { owner } = req.params;
    const { movimientoId } = req.body;

    const wallet = await Wallet.findOne({ owner });
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    wallet.guardados = wallet.guardados.filter(id => id !== movimientoId);
    await wallet.save();
    res.json({ guardados: wallet.guardados });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar movimiento guardado', error: error.message });
  }
};

//CONFIGURACION
export const getWalletConfig = async (req, res) => {
  try {
    const { owner } = req.params;
    const wallet = await Wallet.findOne({ owner })
    res.json(wallet.configuracion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la configuracion de la wallet', error: error.message });
  }
};
export const editarConfiguracionWallet = async (req, res) => {
  try {
    const { owner } = req.params;
    const { hora_corte, monto_max_prestamos } = req.body;

    // Construye el objeto de actualización solo con los campos recibidos
    const updateFields = {};
    if (hora_corte !== undefined) updateFields['configuracion.hora_corte'] = hora_corte;
    if (monto_max_prestamos !== undefined) updateFields['configuracion.monto_max_prestamos'] = monto_max_prestamos;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No se recibieron campos para actualizar.' });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { owner },
      { $set: updateFields },
      { new: true }
    );

    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    res.json({ configuracion: wallet.configuracion });
  } catch (error) {
    res.status(500).json({ message: 'Error al editar configuración', error: error.message });
  }
};