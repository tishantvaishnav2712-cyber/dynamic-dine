const mongoose = require('mongoose');

const DiningSessionSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null,
  },
  customerName: {
    type: String,
    required: true,
    default: 'Walk-in Customer',
  },
  customerPhone: {
    type: String,
    default: '',
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  runningTotal: {
    type: Number,
    required: true,
    default: 0.00,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DiningSession', DiningSessionSchema);
