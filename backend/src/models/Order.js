const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtOrder: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending',
  },
});

const OrderSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiningSession',
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  items: [OrderItemSchema],
  overallStatus: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending',
  },
  specialInstructions: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', OrderSchema);
