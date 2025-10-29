import mongoose from 'mongoose';

const MovimientoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true }, // usuario propietario
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'wallet', required: true },
  tipo: { type: String, enum: ['ingreso', 'egreso'], required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  descripcion: { type: String },
  id_prestamo: { type: mongoose.Schema.Types.ObjectId, ref: 'prestamos' },
  id_cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
  id_asesor: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
  multa: { type: Number, default: 0 },
  interes: { type: Number, default: 0 }
}, { timestamps: true });

// Índices para consultas comunes
MovimientoSchema.index({ owner: 1, fecha: -1 });
MovimientoSchema.index({ walletId: 1, fecha: -1 });
MovimientoSchema.index({ id_prestamo: 1 });

export default mongoose.model('movimientos', MovimientoSchema);