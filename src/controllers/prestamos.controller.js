import Prestamo from "../models/prestamo.model.js"
import Historial from "../models/historial.model.js"
import Wallet from "../models/wallet.model.js";
import Usuario from "../models/usuario.model.js"
import { generarMensajeNotificacion } from '../utils/notificaciones.utils.js';
import Notificacion from '../models/notificaciones.model.js';
import mongoose from "mongoose";

export const getPrestamos = async (req, res) => {
    try {
        const prestamos = await Prestamo.find({ deleteStatus: false })
        //    .populate('id_cliente', 'nombre')
        //    .lean(); // 👈 Convierte los documentos en objetos JS puros

        // Modificamos la respuesta para conservar id_cliente y agregar cliente_nombre
        //const prestamosConNombre = prestamos.map(prestamo => ({
        //    ...prestamo,
        //    cliente_nombre: prestamo.id_cliente.nombre, // Agregamos el nombre
        //    id_cliente: prestamo.id_cliente._id // Restauramos el ID original
        //}));        

        //console.log([prestamosConNombre]);
        res.send(prestamos);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const getPrestamosWithAsesor = async (req, res) => {
    try {
        // const resultado = await Prestamo.aggregate(
        // [
        //     {
        //         $lookup:{
        //             from: "usuarios",
        //             localField: "id_asesor",
        //             foreignField: "_id",
        //             as: "asesor_data"
        //         }
        //     }
        // ]);
        // res.send(resultado);
        const prestamos = await Prestamo.find()
            .populate('id_asesor')   // Trae la info del asesor
            .populate('id_cliente'); // Trae la info del cliente
        res.json(prestamos);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const getPrestamoById = async (req, res) => {
    try {
        // Asegúrate de que el id es un ObjectId válido
        // const mongoose = require('mongoose');
        // const id = mongoose.Types.ObjectId(req.params._id);

        const result = await Prestamo.findById(req.params)
        .populate('id_asesor'); // Esto trae el objeto asesor completo
        res.send(result); // Devuelve solo el objeto, no un array
    } catch (error) {
        res.status(500).send(error);
    }
}

export const getPrestamosByAsesor = async (req, res) => {
    try {
        const prestamos = await Prestamo.find({ 
            deleteStatus:false,
            id_asesor: req.params
        })
        .populate('id_asesor')   // Trae la info del asesor
        .populate('id_cliente'); // Trae la info del cliente
        res.send(prestamos);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const postPrestamo = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Validar wallet activa
        const superUserId = process.env.SUPERUSER_ID;
        const wallet = await Wallet.findOne({ owner: superUserId });
        if (!wallet || !wallet.activa) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'La wallet está apagada. No se pueden otorgar préstamos.' });
        }
        // Validar fondos suficientes
        if (wallet.saldo < req.body.saldo) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Fondos insuficientes en la wallet para otorgar el préstamo.' });
        }

        // 2. Consultar historial del cliente
        const historial = await Historial.findOne({ id_usuario: req.body.id_cliente }).session(session);
        const estadoCliente = historial ? historial.estado_general : null;

        // 3. Preparar datos del préstamo
        req.body.tipo_pago = (req.body.periodo > 6) ? 'Semanal' : 'Mensual';
        let estadoPrestamo = 'Pendiente';
        let tabla_amortizacion = [];
        let fecha_prestamo = null;

        // 4. Si el cliente es bueno, regular o excelente, aceptar y crear tabla
        if (estadoCliente && ['Excelente', 'Bueno', 'Regular'].includes(estadoCliente)) {
            estadoPrestamo = 'Aceptado';
            fecha_prestamo = req.body.fecha_prestamo || new Date().toLocaleDateString('en-CA');
            tabla_amortizacion = await generarTablaAmor(
                req.body.saldo,
                req.body.periodo,
                fecha_prestamo,
                req.body.dia_pago
            );
        }

        // 5. Calcular totales antes de guardar el préstamo
        let totalPagado = 0, totalCuota = 0, totalMultas = 0, totalPendiente = 0;
        if (tabla_amortizacion && tabla_amortizacion.length > 0) {
            const totales = calcularTotales(tabla_amortizacion);
            totalPagado = totales.totalPagado;
            totalCuota = totales.totalCuota;
            totalMultas = totales.totalMultas;
            totalPendiente = totales.totalPendiente;
        }

        // 6. Crear el préstamo con los totales
        const prestamo = new Prestamo({
            saldo: req.body.saldo,
            estado: estadoPrestamo,
            tipo_pago: req.body.tipo_pago,
            periodo: req.body.periodo,
            dia_pago: req.body.dia_pago,
            id_asesor: req.body.id_asesor,
            id_cliente: req.body.id_cliente,
            tabla_amortizacion: tabla_amortizacion,
            fecha_prestamo: fecha_prestamo,
            totalPagado,
            totalCuota,
            totalMultas,
            totalPendiente
        });
        const prestamoSaved = await prestamo.save({ session });

        // 6. Si el préstamo fue aceptado, actualizar historial y wallet
        if (estadoPrestamo === 'Aceptado') {
            // Actualizar historial
            await Historial.updateOne(
                { id_usuario: prestamo.id_cliente },
                {
                    $inc: {
                        prestamos_totales: 1,
                        prestamos_activos: 1,
                        monto_total_prestado: prestamo.saldo
                    },
                    $push: {
                        prestamos_detallados: {
                            id_prestamo: prestamo._id,
                            saldo_pendiente: prestamo.saldo,
                            estado: prestamo.estado,
                            fecha_inicio: fecha_prestamo
                        }
                    }
                },
                { session }
            );

            // Registrar egreso en la wallet
            const cliente = await Usuario.findById(req.body.id_cliente).session(session);
            const asesor = await Usuario.findById(req.body.id_asesor).session(session);
            await Wallet.findOneAndUpdate(
                { owner: superUserId },
                {
                    $inc: { saldo: -prestamo.saldo },
                    $push: {
                        movimientos: {
                            tipo: 'egreso',
                            monto: prestamo.saldo,
                            descripcion: `Préstamo otorgado a cliente ${cliente.nombre}`,
                            id_prestamo: prestamo._id,
                            id_cliente: prestamo.id_cliente,
                            id_asesor: prestamo.id_asesor
                        }
                    }
                },
                { session }
            );

            //Crear notificacion para el super usuario sobre el prestamo
            const mensaje = generarMensajeNotificacion({
                type: 'prestamo',
                data: { monto: prestamo.saldo, periodo: prestamo.periodo },
                from: asesor, // objeto usuario asesor
                to: cliente   // objeto usuario cliente
            });

            await Notificacion.create({
                type: 'prestamo',
                userId: process.env.SUPERUSER_ID,
                from: asesor._id,
                mensaje,
                data: { id_prestamo: prestamo._id, monto: prestamo.saldo, periodo: prestamo.periodo }
            });
        }

        await session.commitTransaction();
        session.endSession();

        // 7. Responder con el préstamo y el estado del cliente
        res.json({
            prestamo: prestamoSaved,
            estadoCliente: estadoCliente || 'Sin historial',
            aceptado: estadoPrestamo === 'Aceptado'
        });
    } catch (error) {
        res.status(500).send(error);
    }
}

export const putPrestamo = async (req, res) => {
    try {
        const updatePrestamo = await Prestamo.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        res.json(updatePrestamo);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const pagarMulta = async (req, res) => {
    try {
        const { id_prestamo, num_pago } = req.params;

        // Buscar el préstamo y actualizar la multa del pago específico
        const prestamo = await Prestamo.findOneAndUpdate(
            { _id: id_prestamo, "tabla_amortizacion.num_pago": num_pago }, 
            {
                $set: {
                    "tabla_amortizacion.$.multa.saldado": true,
                    "tabla_amortizacion.$.estado_pago": 'Pagado',
                    //"tabla_amortizacion.$.multa.monto_pendiente": 0, //Por ahora no se usa debido al front para mostrar el historial de las multas
                    "tabla_amortizacion.$.multa.fecha_pago": new Date()
                }
            },
            { new: true } // Para devolver el documento actualizado
        );

        if (!prestamo) {
            return res.status(404).json({ message: "Préstamo o pago no encontrado" });
        }

        // Recalcula los totales
        const { totalPagado, totalCuota, totalMultas, totalPendiente } = calcularTotales(prestamo.tabla_amortizacion);

        prestamo.totalPagado = totalPagado;
        prestamo.totalCuota = totalCuota;
        prestamo.totalMultas = totalMultas;
        prestamo.totalPendiente = totalPendiente;
        await prestamo.save();

        // Actualiza el historial
        await Historial.updateOne(
            { id_usuario: prestamo.id_cliente, "prestamos_detallados.id_prestamo": prestamo._id },
            {
                $set: {
                    "prestamos_detallados.$.saldo_pendiente": totalPendiente,
                    "prestamos_detallados.$.multas_pendientes": totalMultas,
                    "prestamos_detallados.$.pagos_pendientes": totalCuota,
                    "prestamos_detallados.$.total_pagado": totalPagado,
                    "prestamos_detallados.$.estado": prestamo.estado
                }
            }
        );

        // Extraer solo la multa del pago actualizado
        // const multaActualizada = prestamo.tabla_amortizacion[0].multa;
        const multa_actualizada = prestamo.tabla_amortizacion[num_pago - 1].multa

        res.json({ 
            message: "Multa pagada con éxito", 
            multa: multa_actualizada,
            totalPagado,
            totalCuota,
            totalMultas,
            totalPendiente
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en el servidor" });
    }
}


export const rechazarPrestamo = async (req, res) => {
    try {
        const rejectedPrestamo = await Prestamo.findByIdAndUpdate(
            req.params, 
            {
                estado : 'Rechazado'
            },
            { new: true }
        );
        res.json(rejectedPrestamo)
    } catch (error) {
        res.status(500).send(error)
    }
}

export const cerrarPago = async (req, res) => {
    try {
        const cerrarPrestamo = await Prestamo.findByIdAndUpdate(
            req.params, 
            {
                estado : 'Cerrado'
            },
            { new: true }
        );
        res.json(cerrarPrestamo)
    } catch (error) {
        res.status(500).send(error)
    }
}

export const deletePrestamo = async (req, res) => {
    try {
        const deletedPrestamo = await Prestamo.findByIdAndUpdate(req.params.id, {
            deleteStatus: true
        });
        res.json(deletedPrestamo);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const crearTabalAmortizacion = async (req, res) => {
    console.log(req.body)
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const superUserId = process.env.SUPERUSER_ID;
        const wallet = await Wallet.findOne({ owner: superUserId }).session(session);
        if (!wallet || !wallet.activa) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'La wallet está apagada. No se pueden aceptar préstamos.' });
        }

        // Buscar el préstamo para saber el monto
        const prestamo = await Prestamo.findById(req.params).session(session);
        if (!prestamo) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Préstamo no encontrado.' });
        }
        if (wallet.saldo < prestamo.saldo) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Fondos insuficientes en la wallet para aceptar el préstamo.' });
        }

        if (prestamo.tabla_amortizacion.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.send({ message: 'Ya existe una tabla de amortización' });
        }

        // Generar tabla de amortización
        const tabla = await generarTablaAmor(prestamo.saldo, prestamo.periodo, req.body.fecha_prestamo, req.body.dia_pago);
        let totalPagado = 0, totalCuota = 0, totalMultas = 0, totalPendiente = 0;
        if (tabla && tabla.length > 0) {
            const totales = calcularTotales(tabla);
            totalPagado = totales.totalPagado;
            totalCuota = totales.totalCuota;
            totalMultas = totales.totalMultas;
            totalPendiente = totales.totalPendiente;
        }

        // Actualizar el préstamo
        const updateTablePrest = await Prestamo.findByIdAndUpdate(
            req.params,
            {
                tabla_amortizacion: tabla,
                estado: 'Aceptado',
                fecha_prestamo: new Date(req.body.fecha_prestamo),
                totalPagado,
                totalCuota,
                totalMultas,
                totalPendiente
            },
            { new: true, session }
        );

        // Actualizar historial
        await Historial.updateOne(
            { id_usuario: prestamo.id_cliente },
            {
                $inc: {
                    prestamos_totales: 1,
                    prestamos_activos: 1,
                    monto_total_prestado: prestamo.saldo
                },
                $push: {
                    prestamos_detallados: {
                        id_prestamo: prestamo._id,
                        saldo_pendiente: prestamo.saldo,
                        estado: updateTablePrest.estado,
                        fecha_inicio: new Date().toLocaleDateString('en-CA')
                    }
                }
            },
            { session }
        );

        console.log(prestamo)
        // Registrar egreso en la wallet
        const cliente = await Usuario.findById(prestamo.id_cliente).session(session);
        const asesor = await Usuario.findById(prestamo.id_asesor).session(session);
        console.log(cliente, asesor)

        if (!cliente || !asesor) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Cliente o asesor no encontrado.' });
        }

        await Wallet.findOneAndUpdate(
            { owner: superUserId },
            {
                $inc: { saldo: -prestamo.saldo },
                $push: {
                    movimientos: {
                        tipo: 'egreso',
                        monto: prestamo.saldo,
                        descripcion: `Préstamo otorgado a cliente ${cliente.nombre}`,
                        id_prestamo: prestamo._id,
                        id_cliente: prestamo.id_cliente,
                        id_asesor: prestamo.id_asesor
                    }
                }
            },
            { session }
        );

        // Crear notificación para el asesor sobre el préstamo aprobado
        const mensaje = generarMensajeNotificacion({
            type: 'autorizacion',
            data: { monto: prestamo.saldo },
            from: superUserId,
            to: cliente
        });

        await Notificacion.create([{
            type: 'prestamo',
            userId: asesor._id,
            from: superUserId,
            mensaje,
            data: { id_prestamo: prestamo._id }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json(updateTablePrest);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).send(error);
    }
}

export const putTablaAmrPago = async (req, res) => {
    try {

        // 1. Actualiza la tabla
        const updateTablaAmortz = await Prestamo.findByIdAndUpdate(req.params, 
            req.body, 
            {new: true}
        );

        // 2. Calcula los totales (podemos reutilizar la lógica del front aquí)
        const { totalPagado, totalCuota, totalMultas, totalPendiente } = calcularTotales(updateTablaAmortz.tabla_amortizacion);

        // 3. Actualiza el préstamo con los totales
        updateTablaAmortz.totalPagado = totalPagado;
        updateTablaAmortz.totalCuota = totalCuota;
        updateTablaAmortz.totalMultas = totalMultas;
        updateTablaAmortz.totalPendiente = totalPendiente;
        await updateTablaAmortz.save();

        // 4. Actualiza el historial
        await Historial.updateOne(
            { id_usuario: updateTablaAmortz.id_cliente, "prestamos_detallados.id_prestamo": updateTablaAmortz._id },
            {
                $set: {
                    "prestamos_detallados.$.saldo_pendiente": totalPendiente,
                    "prestamos_detallados.$.multas_pendientes": totalMultas,
                    "prestamos_detallados.$.pagos_pendientes": totalCuota,
                    "prestamos_detallados.$.total_pagado": totalPagado,
                    "prestamos_detallados.$.estado": updateTablaAmortz.estado
                }
            }
        );

        res.json(updateTablaAmortz);
    } catch (error) {
        res.status(500).send(error);
    }
}

// Función para calcular los totales (podemos reutilizar la lógica del front aquí)
export function calcularTotales(tabla) {
    let totalPagado = 0, totalCuota = 0, totalMultas = 0, totalPendiente = 0;
    for (let pago of tabla) {
        totalCuota += pago.cuota;
        if(!pago.multa?.saldado) totalMultas += pago.multa?.monto_pendiente || 0;
        if (pago.estado_pago === 'Pagado' || pago.multa?.saldado) totalPagado += pago.cuota + (pago.multa?.monto_pendiente || 0);
        if (pago.estado_pago === 'No pagado') totalPendiente += pago.cuota;
        if (pago.estado_pago === 'Pendiente' && pago.abono_pago) totalPendiente += (pago.cuota - pago.abono_pago)
    }
    return { totalPagado, totalCuota, totalMultas, totalPendiente };
}

const generarTablaAmor = async (monto, periodo, fecha, dia_semana) =>{

    let tabla = [];
    let interes_fijo = periodo > 6 ? 10 : 12.5; //Si el periodo es de 6 o 3 meses, el interes es de 12.5
    let intereses_a_pagar = 0;

    intereses_a_pagar = (interes_fijo * monto) / (100);

    let fechas = calcularFechas(fecha, periodo, dia_semana)
    for (let i = 1; i <= periodo; i++) { // if periodo 
        tabla.push({
            num_pago: i,
            fecha_pago: fechas[i - 1],
            cuota: intereses_a_pagar,
            estado_pago: 'No pagado'
        });
    }
    
    periodo > 6 ? '' : tabla[tabla.length - 1].cuota = intereses_a_pagar + monto; //Si el periodo es de 6 o 3 meses, el interes es de 12.5
    // tabla[tabla.length - 1].cuota = intereses_a_pagar + monto
    // console.log(fechas)
    // console.log(tabla)
    // this.dataTableMort = tabla
    return tabla
}

const calcularFechas = (fechaInicial, periodo, dia_pago) => { // dia_pago Lunes | Sábado
    console.log(fechaInicial)
    const fechas = [];
    const fechaBase = new Date(fechaInicial + 'T00:00:00-06:00'); ///////////////////////////////////////

    // Si el período es mayor a 6, asumimos que es semanal
    if (periodo > 6) { //Si es mayor a 6 es de 14 semanas
        // Ajustar la fecha al próximo lunes
        const diaDeLaSemana = fechaBase.getDay(); // 0: Domingo, 1: Lunes, 2: Martes ..., 6: Sábado
        var diasHastaDiaPago = 0
        
            if (dia_pago == 'lunes') {
                diasHastaDiaPago = (diaDeLaSemana === 0) ? 1 : 8 - diaDeLaSemana; // Próximo lunes
                // diasHastaDiaPago = (diaDeLaSemana == 1) ? 7 : diaDeLaSemana === 0 ? 1 : 8 - diaDeLaSemana; // Próximo lunes
            } else if (dia_pago == 'sabado') {
                diasHastaDiaPago = (diaDeLaSemana == 6 ? 7 : 6 - diaDeLaSemana); // Próximo sábado
            }

        fechaBase.setDate(fechaBase.getDate() + diasHastaDiaPago);

        // Generar las fechas semanalmente
        for (let i = 0; i < periodo; i++) {
            const nuevaFecha = new Date(fechaBase);
            nuevaFecha.setDate(fechaBase.getDate() + i * 7); // Sumar semanas
            fechas.push(nuevaFecha);
        }
    } else {
        const mesInicial = fechaBase.getMonth(); // 0: enero, 1: febrero, 2: marzo ..., 11: diciembre
        const diaInicial = fechaBase.getDate();
        // Ajustar si el día original no existe en el mes actual antes de mover al siguiente mes
        // Validar y ajustar la fecha base antes de avanzar al siguiente mes
        if (diaInicial > 28) {
            fechaBase.setMonth(fechaBase.getMonth() + 1); // Mover al siguiente mes
            if (fechaBase.getMonth() !== (mesInicial + 1) % 12) {
                fechaBase.setDate(0); // Ajustar al último día del mes anterior
            }
        } else {
            fechaBase.setMonth(fechaBase.getMonth() + 1); // Mover al siguiente mes
        }
        
        for (let i = 0; i < periodo; i++) {
            const nuevaFecha = new Date(fechaBase);
            nuevaFecha.setMonth(fechaBase.getMonth() + i, diaInicial); // Incrementar el mes junto con el día inicial
            
            // Ajustar si el día original no existe en el mes actual por ejemplo si no existe 29-30-31 setea al ultimo día del mes 
            if (nuevaFecha.getMonth() !== (fechaBase.getMonth() + i) % 12) {
                nuevaFecha.setDate(0); // Ir al último día del mes
            }

            fechas.push(nuevaFecha);
        }
    }

    return fechas;
}