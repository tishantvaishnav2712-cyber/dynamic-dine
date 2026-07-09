const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  priceAtOrder: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiningSession',
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  gst: {
    type: Number,
    required: true,
  },
  serviceCharge: {
    type: Number,
    required: true,
    default: 0.00,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'online'],
    required: true,
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'paid',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
