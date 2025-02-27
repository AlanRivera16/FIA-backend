import Prestamo from "../models/prestamo.model.js"

export const getPrestamos = async (req, res) => {
    try {
        const prestamos = await Prestamo.find({ deleteStatus:false });
        res.send(prestamos);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const getPrestamoById = async (req, res) => {
    try {
        const resultado = await Prestamo.aggregate(
        [
            {
                $lookup:{
                    from: "usuarios",
                    localField: "id_asesor",
                    foreignField: "_id",
                    as: "asesor_data"
                }
            }
        ]);
        res.send(resultado);
    } catch (error) {
        res.status(500).send(error);
    }
}

export const postPrestamo = async (req, res) => {
    try {
        
      req.body.tipo_pago = (req.body.periodo > 6) ? 'Semanal' : 'Mensual';
      const prestamo = new Prestamo({
        saldo: req.body.saldo,
        // estado: req.body.estado,
        tipo_pago: req.body.tipo_pago,
        periodo: req.body.periodo,
        dia_pago: req.body.dia_pago,
        id_asesor: req.body.id_asesor,
        id_cliente: req.body.id_cliente,
        // tabla_amortizacion: req.body,
      });

      const prestamoSaved = await prestamo.save();
      res.json(prestamoSaved);

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
                    "tabla_amortizacion.$.multa.monto_pendiente": 0
                }
            },
            { new: true } // Para devolver el documento actualizado
        );

        if (!prestamo) {
            return res.status(404).json({ message: "Préstamo o pago no encontrado" });
        }

        // Extraer solo la multa del pago actualizado
        // const multaActualizada = prestamo.tabla_amortizacion[0].multa;
        const multa_actualizada = prestamo.tabla_amortizacion[num_pago - 1].multa

        res.json({ message: "Multa pagada con éxito", multa: multa_actualizada });

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
    if (req.body.dia_pago) console.log('Es un prestamo mensual')
    try {
        const prestamo = await Prestamo.findById(req.params);//Data del prestamo 
        if(prestamo.tabla_amortizacion.length == 0){ //Si no hay una tabla de amortización aún
            const tabla = await generarTablaAmor(prestamo.saldo, prestamo.periodo, req.body.fecha_prestamo, req.body.dia_pago)
            // console.log(prestamo);
            // console.log(tabla);

            const updateTablePrest = await Prestamo.findByIdAndUpdate(
                req.params,
                { 
                    tabla_amortizacion: tabla, 
                    estado : 'Aceptado',
                    fecha_prestamo: new Date(req.body.fecha_prestamo + 'T00:00:00-06:00')
                },
                { new: true }
            );
            res.json(updateTablePrest)
        } else{
        res.send({message:'Ya existe una tabla de amortización'})
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

export const putTablaAmrPago = async (req, res) => {
    try {
        const updateTablaAmortz = await Prestamo.findByIdAndUpdate(req.params, 
            req.body, 
            {new: true}
        );
        res.json(updateTablaAmortz);
    } catch (error) {
        res.status(500).send(error);
    }
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