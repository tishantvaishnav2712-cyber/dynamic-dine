const PricingConfig = require('../models/PricingConfig');
const PricingHistory = require('../models/PricingHistory');
const Product = require('../models/Product');
const scheduler = require('../services/pricingScheduler');

// @desc    Get pricing configuration
// @route   GET /api/pricing/config
// @access  Private (Admin)
const getPricingConfig = async (req, res, next) => {
  try {
    let config = await PricingConfig.findOne({});
    if (!config) {
      config = await PricingConfig.create({});
    }
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pricing configuration & reschedule cron jobs
// @route   PUT /api/pricing/config
// @access  Private (Admin)
const updatePricingConfig = async (req, res, next) => {
  try {
    const {
      globalEnabled,
      demandThresholdIncrease,
      demandThresholdDecrease,
      priceIncreasePercent,
      priceDecreasePercent,
      fixedIncreaseAmount,
      fixedDecreaseAmount,
      demandWindowMinutes,
      cronIntervalMinutes,
      maxPriceChangePerUpdatePercent,
    } = req.body;

    let config = await PricingConfig.findOne({});
    if (!config) {
      config = new PricingConfig({});
    }

    if (globalEnabled !== undefined) config.globalEnabled = globalEnabled;
    if (demandThresholdIncrease !== undefined) config.demandThresholdIncrease = parseFloat(demandThresholdIncrease);
    if (demandThresholdDecrease !== undefined) config.demandThresholdDecrease = parseFloat(demandThresholdDecrease);
    if (priceIncreasePercent !== undefined) config.priceIncreasePercent = parseFloat(priceIncreasePercent);
    if (priceDecreasePercent !== undefined) config.priceDecreasePercent = parseFloat(priceDecreasePercent);
    if (fixedIncreaseAmount !== undefined) config.fixedIncreaseAmount = parseFloat(fixedIncreaseAmount);
    if (fixedDecreaseAmount !== undefined) config.fixedDecreaseAmount = parseFloat(fixedDecreaseAmount);
    if (demandWindowMinutes !== undefined) config.demandWindowMinutes = parseInt(demandWindowMinutes, 10);
    
    // If cron interval changed, reschedule background tick job
    const originalInterval = config.cronIntervalMinutes;
    if (cronIntervalMinutes !== undefined) {
      config.cronIntervalMinutes = parseInt(cronIntervalMinutes, 10);
    }

    await config.save();

    // Trigger rescheduling in scheduler service if interval changed
    if (cronIntervalMinutes !== undefined && originalInterval !== config.cronIntervalMinutes) {
      scheduler.reschedulePricingTicks(config.cronIntervalMinutes, req.io);
      console.log(`Rescheduled pricing ticks to run every ${config.cronIntervalMinutes} minutes`);
    }

    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pricing history
// @route   GET /api/pricing/history
// @access  Private (Admin)
const getPricingHistory = async (req, res, next) => {
  try {
    const { productId, limit, page, reason } = req.query;

    const query = {};
    if (productId) {
      query.product = productId;
    }
    if (reason) {
      query.reason = reason;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const history = await PricingHistory.find(query)
      .populate('product')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await PricingHistory.countDocuments(query);

    res.json({
      success: true,
      count: history.length,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset all product prices back to base values
// @route   POST /api/pricing/reset
// @access  Private (Admin)
const resetAllPrices = async (req, res, next) => {
  try {
    const products = await Product.find({ dynamicPricingEnabled: true });
    
    const logs = [];
    for (const product of products) {
      const previousPrice = product.currentPrice;
      if (previousPrice === product.basePrice) continue;

      product.currentPrice = product.basePrice;
      product.demandScore = 0;
      await product.save();

      const percentageChanged = previousPrice > 0
        ? ((product.basePrice - previousPrice) / previousPrice) * 100
        : 0;

      logs.push({
        product: product._id,
        previousPrice,
        newPrice: product.basePrice,
        basePrice: product.basePrice,
        demandScore: 0,
        triggerThreshold: 'Bulk manual reset',
        percentageChanged: parseFloat(percentageChanged.toFixed(2)),
        reason: 'manual_reset',
      });
    }

    if (logs.length > 0) {
      await PricingHistory.insertMany(logs);
      
      // Emit bulk price update broadcast
      if (req.io) {
        req.io.emit('prices_reset', { message: 'All prices reset to base values' });
      }
    }

    res.json({
      success: true,
      message: `Reset ${logs.length} active dynamic product prices back to base rates`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPricingConfig,
  updatePricingConfig,
  getPricingHistory,
  resetAllPrices,
};
