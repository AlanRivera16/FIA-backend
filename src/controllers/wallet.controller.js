// src/controllers/wallet.controller.js
import Wallet from '../models/wallet.model.js';
import Movimiento from '../models/movimientos.model.js'; // nuevo modelo
import mongoose from 'mongoose';
//import { Parser } from 'json2csv';

// export const getWalletInfo = async (req, res) => {
//   try {
//     const { owner } = req.params;
//     const wallet = await Wallet.findOne({ owner }).populate('movimientos.id_prestamo movimientos.id_cliente movimientos.id_asesor recentMovimientos');
//     res.json(wallet);
//   } catch (error) {
//     res.status(500).json({ message: 'Error al obtener wallet', error: error.message });
//   }
// };

export const getWalletInfo = async (req, res) => {
  try {
    const { owner } = req.params;
    const wallet = await Wallet.findOne({ owner })
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
    
    const movimientosGenerales = await Movimiento.find({ walletId: wallet._id })
    wallet.movimientos = movimientosGenerales
    
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener wallet', error: error.message });
  }
};

// export const getWalletInfo = async (req, res) => {
//   try {
//     const { owner } = req.params;
//     // Popula los objetos Movimiento y, dentro de ellos, los refs anidados
//     const wallet = await Wallet.findOne({ owner }).populate({
//       path: 'recentMovimientos',
//       populate: [
//         { path: 'id_cliente', select: 'nombre evidencia_aval telefono email' },
//         { path: 'id_asesor', select: 'nombre evidencia_aval role' },
//         //{ path: 'id_prestamo' } // puedes seleccionar campos específicos si quieres
//       ]
//     });
//     if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
//     res.json(wallet);
//   } catch (error) {
//     res.status(500).json({ message: 'Error al obtener wallet', error: error.message });
//   }
// };
// ...existing code...

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
    // const wallet = await Wallet.findOne({ owner }).populate('movimientos.id_prestamo movimientos.id_cliente movimientos.id_asesor');
    // if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
    const wallet = await Wallet.findOne({ owner })
    if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });

    let movimientosCollection = await Movimiento.find({ walletId: wallet._id})
      .populate('id_cliente id_asesor id_prestamo')
    //console.log(movimientosCollection)

    let movimientos = movimientosCollection.filter(mov => {
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

export const registrarMovimiento2 = async (req, res, externalSession = null) => {
  let session = externalSession;
  let createdSession = false;

  try {
    if (!session) {
      session = await mongoose.startSession();
      session.startTransaction();
      createdSession = true;
    }

    const { owner, tipo, monto, descripcion, id_prestamo, id_cliente, id_asesor, multa, interes } = req.body;

    const wallet = await Wallet.findOne({ owner }).session(session);
    if (!wallet) {
      const err = new Error('Wallet no encontrada');
      if (createdSession) {
        await session.abortTransaction();
        session.endSession();
      }
      throw err;
    }

    // 1) Crear movimiento en colección separada
    const movimientoDocs = await Movimiento.create([{
      owner,
      walletId: wallet._id,
      tipo, monto, descripcion, id_prestamo, id_cliente, id_asesor, multa, interes
    }], { session });

    // 2) Actualizar saldo de wallet
    const newSaldo = wallet.saldo + (tipo === 'ingreso' ? monto : -monto);

    // 3) Mantener cache de últimos N movimientos (ej: 10)
    const movId = movimientoDocs[0]._id;
    await Wallet.findByIdAndUpdate(wallet._id, {
      $set: { saldo: newSaldo },
      $push: { recentMovimientos: { $each: [movId], $position: 0, $slice: 10 } }
    }, { session });

    if (createdSession) {
      await session.commitTransaction();
      session.endSession();
      // respuesta HTTP cuando la función es usada directamente por una ruta
      if (res && typeof res.json === 'function') {
        return res.json({ movimiento: movimientoDocs[0], saldo: newSaldo });
      }
      return { movimiento: movimientoDocs[0], saldo: newSaldo };
    } else {
      // si la session viene del caller, retornamos resultado y el caller hará commit/abort
      return { movimiento: movimientoDocs[0], saldo: newSaldo };
    }
  } catch (error) {
    if (createdSession && session) {
      await session.abortTransaction();
      session.endSession();
    }
    // Rethrow para que el caller (si comparte session) capture y aborte
    throw error;
  }
};

// export const depositarWallet = async (req, res) => {
//   try {
//     const { owner } = req.params;
//     const { monto, descripcion } = req.body;
//     if (monto <= 0) return res.status(400).json({ message: 'El monto debe ser mayor a cero.' });

//     const wallet = await Wallet.findOneAndUpdate(
//       { owner },
//       {
//         $inc: { saldo: monto },
//         $push: {
//           movimientos: {
//             tipo: 'ingreso',
//             monto,
//             descripcion: descripcion || 'Depósito manual'
//           }
//         }
//       },
//       { new: true }
//     );
//     if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
//     res.json(wallet);
//   } catch (error) {
//     res.status(500).json({ message: 'Error al depositar en la wallet', error: error.message });
//   }
// };

// export const retirarWallet = async (req, res) => {
//   try {
//     const { owner } = req.params;
//     const { monto, descripcion } = req.body;
//     if (monto <= 0) return res.status(400).json({ message: 'El monto debe ser mayor a cero.' });

//     const wallet = await Wallet.findOne({ owner });
//     if (!wallet) return res.status(404).json({ message: 'Wallet no encontrada' });
//     if (wallet.saldo < monto) return res.status(400).json({ message: 'Saldo insuficiente.' });

//     wallet.saldo -= monto;
//     wallet.movimientos.push({
//       tipo: 'egreso',
//       monto,
//       descripcion: descripcion || 'Retiro manual'
//     });
//     await wallet.save();
//     res.json(wallet);
//   } catch (error) {
//     res.status(500).json({ message: 'Error al retirar de la wallet', error: error.message });
//   }
// };

// ...existing code...

export const depositarWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { owner } = req.params;
    const { monto, descripcion } = req.body;
    if (!monto || monto <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'El monto debe ser mayor a cero.' });
    }

    const wallet = await Wallet.findOne({ owner }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Wallet no encontrada' });
    }

    // Prepara payload para registrarMovimiento2
    const payload = {
      owner,
      tipo: 'ingreso',
      monto,
      descripcion: descripcion || 'Depósito manual'
    };

    // registrarMovimiento2 acepta una session externa y no commitea cuando se la pasamos
    const result = await registrarMovimiento2({ body: payload }, null, session);

    await session.commitTransaction();
    session.endSession();

    return res.json(result);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: 'Error al depositar en la wallet', error: error.message });
  }
};

export const retirarWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { owner } = req.params;
    const { monto, descripcion } = req.body;
    if (!monto || monto <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'El monto debe ser mayor a cero.' });
    }

    const wallet = await Wallet.findOne({ owner }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Wallet no encontrada' });
    }

    if (wallet.saldo < monto) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Saldo insuficiente.' });
    }

    const payload = {
      owner,
      tipo: 'egreso',
      monto,
      descripcion: descripcion || 'Retiro manual'
    };

    const result = await registrarMovimiento2({ body: payload }, null, session);

    await session.commitTransaction();
    session.endSession();

    return res.json(result);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: 'Error al retirar de la wallet', error: error.message });
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