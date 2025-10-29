import mongoose from "mongoose";

const MovimientoSchema = mongoose.Schema({
  tipo: { type: String, enum: ['ingreso', 'egreso'], required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  descripcion: { type: String },
  id_prestamo: { type: mongoose.Schema.Types.ObjectId, ref: 'prestamos' },
  id_cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
  id_asesor: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
  multa: { type: Number, default: 0 },
  interes: { type: Number, default: 0 }
});

const Configuraciones = mongoose.Schema({
    hora_corte: {
      type: String,
      default: '2025-09-26T20:01:00'
    },
    monto_max_prestamos: {
      type: Number,
      default: 24000
    },
});

const WalletSchema = mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true }, // Super usuario
  saldo: { type: Number, default: 0 },
  activa: { type: Boolean, default: true },
  movimientos: [MovimientoSchema], //Esto va a desaparecer para mejor escalabilidad
  guardados: [],
  configuracion: Configuraciones
}, { timestamps: true });

export default mongoose.model("wallet", WalletSchema);