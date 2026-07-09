const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 10,
  },
  capacity: {
    type: Number,
    required: true,
    default: 4,
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied', 'cleaning'],
    default: 'available',
  },
  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiningSession',
    default: null,
  },
  qrCodeData: {
    type: String,
    default: '', // Encrypted or signed token string representing secure verification URL
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Table', TableSchema);
