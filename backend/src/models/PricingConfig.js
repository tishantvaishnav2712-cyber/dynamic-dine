const mongoose = require('mongoose');

const PricingConfigSchema = new mongoose.Schema({
  globalEnabled: {
    type: Boolean,
    default: true,
  },
  demandThresholdIncrease: {
    type: Number,
    required: true,
    default: 10, // increase price if ordered >= X times
  },
  demandThresholdDecrease: {
    type: Number,
    required: true,
    default: 3, // decrease price if ordered <= Y times
  },
  priceIncreasePercent: {
    type: Number,
    required: true,
    default: 5.0, // e.g. 5%
  },
  priceDecreasePercent: {
    type: Number,
    required: true,
    default: 3.0, // e.g. 3%
  },
  fixedIncreaseAmount: {
    type: Number,
    default: 0.0,
  },
  fixedDecreaseAmount: {
    type: Number,
    default: 0.0,
  },
  demandWindowMinutes: {
    type: Number,
    required: true,
    default: 30, // time frame for orders counting
  },
  cronIntervalMinutes: {
    type: Number,
    required: true,
    default: 5, // cron run frequency (can be simulated shorter for testing)
  },
  maxPriceChangePerUpdatePercent: {
    type: Number,
    required: true,
    default: 15.0, // clamp max single adjustment
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PricingConfig', PricingConfigSchema);
