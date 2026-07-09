const mongoose = require('mongoose');

const PricingHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  previousPrice: {
    type: Number,
    required: true,
  },
  newPrice: {
    type: Number,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  demandScore: {
    type: Number,
    required: true,
    default: 0,
  },
  triggerThreshold: {
    type: String,
    default: '',
  },
  percentageChanged: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    enum: ['high_demand', 'low_demand', 'manual_reset', 'manual_override', 'inactivity_decay', 'stable_demand'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PricingHistory', PricingHistorySchema);
