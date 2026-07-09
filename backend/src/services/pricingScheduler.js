const Product = require('../models/Product');
const Order = require('../models/Order');
const PricingConfig = require('../models/PricingConfig');
const PricingHistory = require('../models/PricingHistory');

let pricingIntervalRef = null;

// Core Evaluation Tick
const runPricingEvaluation = async (io) => {
  try {
    const config = await PricingConfig.findOne({});
    if (!config || !config.globalEnabled) {
      console.log('Dynamic pricing skipped: disabled globally');
      return;
    }

    console.log('--- STARTING DYNAMIC PRICING EVALUATION TICK (RELATIVE DEMAND ENGINE) ---');

    const products = await Product.find({ dynamicPricingEnabled: true, isAvailable: true });
    if (products.length === 0) {
      console.log('No active dynamic pricing products found.');
      return;
    }

    const windowMinutes = config.demandWindowMinutes || 30;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    let totalDemand = 0;
    const productData = [];

    // 1. First Pass: Gather active order demand for each product
    for (const product of products) {
      const matchingOrders = await Order.find({
        createdAt: { $gte: windowStart },
        overallStatus: { $ne: 'cancelled' },
        'items.product': product._id,
      });

      let demandQty = 0;
      matchingOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.product.toString() === product._id.toString() && item.status !== 'cancelled') {
            demandQty += item.quantity;
          }
        });
      });

      // Update demand score cache
      product.demandScore = demandQty;
      totalDemand += demandQty;
      productData.push({ product, demandQty });
    }

    // 2. Compute average baseline demand across all items
    const numProducts = products.length;
    const averageDemand = totalDemand / numProducts;

    console.log(`Relative Pricing Stats -> Total Demand: ${totalDemand}, Average Demand per Item: ${averageDemand.toFixed(2)}`);

    // 3. Second Pass: Apply relative valuation logic
    for (const { product, demandQty } of productData) {
      const previousPrice = product.currentPrice;
      let newPrice = previousPrice;
      let percentageChanged = 0;
      let reason = '';
      let triggerThreshold = '';

      if (totalDemand > 0) {
        if (demandQty > averageDemand) {
          // Demand is above average -> Price rises
          // Scale rate based on performance factor: demandQty / averageDemand
          const rawScale = averageDemand > 0 ? (demandQty / averageDemand) : 1;
          const scaleFactor = Math.min(3.0, rawScale); // Cap scale at 3.0 to prevent hyperinflation
          
          const incFactor = (config.priceIncreasePercent / 100) * scaleFactor;
          newPrice = previousPrice * (1 + incFactor) + config.fixedIncreaseAmount;

          // Clamp to maximum boundaries
          if (newPrice > product.maxPrice) newPrice = product.maxPrice;

          // Clamp single step updates
          const maxStepJump = previousPrice * (1 + config.maxPriceChangePerUpdatePercent / 100);
          if (newPrice > maxStepJump) newPrice = maxStepJump;

          reason = 'high_demand';
          triggerThreshold = `Demand (${demandQty}) > Avg (${averageDemand.toFixed(2)}) | Scale: ${rawScale.toFixed(2)}x`;
        } else if (demandQty < averageDemand) {
          // Demand is below average -> Price decays
          const decFactor = config.priceDecreasePercent / 100;
          newPrice = previousPrice * (1 - decFactor) - config.fixedDecreaseAmount;

          // Clamp to minimum boundaries
          if (newPrice < product.minPrice) newPrice = product.minPrice;

          reason = 'low_demand';
          triggerThreshold = `Demand (${demandQty}) < Avg (${averageDemand.toFixed(2)})`;
        } else {
          // Exactly equal to average -> price remains unchanged
          reason = 'stable_demand';
          triggerThreshold = `Demand (${demandQty}) === Avg (${averageDemand.toFixed(2)})`;
        }
      } else {
        // No activity in the restaurant -> decay prices slowly to avoid stagnant high prices
        const decFactor = config.priceDecreasePercent / 100;
        newPrice = previousPrice * (1 - decFactor) - config.fixedDecreaseAmount;

        // Clamp to minimum boundaries
        if (newPrice < product.minPrice) newPrice = product.minPrice;

        reason = 'inactivity_decay';
        triggerThreshold = `Total demand is 0`;
      }

      // Round to double decimal precision
      newPrice = parseFloat(newPrice.toFixed(2));

      // 4. Save and broadcast if price changed
      if (newPrice !== previousPrice) {
        product.currentPrice = newPrice;
        await product.save();

        percentageChanged = ((newPrice - previousPrice) / previousPrice) * 100;

        await PricingHistory.create({
          product: product._id,
          previousPrice,
          newPrice,
          basePrice: product.basePrice,
          demandScore: demandQty,
          triggerThreshold,
          percentageChanged: parseFloat(percentageChanged.toFixed(2)),
          reason,
        });

        console.log(`[Relative Engine] Adjusted ${product.name}: ₹${previousPrice.toFixed(2)} -> ₹${newPrice.toFixed(2)} (${reason})`);

        // Emit real-time price updates via socket
        if (io) {
          io.emit('price_updated', {
            productId: product._id,
            currentPrice: newPrice,
            previousPrice,
            percentageChanged: parseFloat(percentageChanged.toFixed(2)),
          });
        }
      } else {
        // Save the updated demandScore even if price is unchanged
        await product.save();
      }
    }

    console.log('--- COMPLETED DYNAMIC PRICING EVALUATION TICK ---');
  } catch (error) {
    console.error('Error during relative pricing evaluation:', error.message);
  }
};

// Initialize scheduler
const initPricingScheduler = async (io) => {
  try {
    let config = await PricingConfig.findOne({});
    if (!config) {
      config = await PricingConfig.create({});
    }

    const intervalMinutes = config.cronIntervalMinutes || 5;
    
    // Clear existing interval if set
    if (pricingIntervalRef) {
      clearInterval(pricingIntervalRef);
    }

    // Schedule the interval
    pricingIntervalRef = setInterval(() => {
      runPricingEvaluation(io);
    }, intervalMinutes * 60 * 1000);

    console.log(`Dynamic pricing engine scheduler active. Evaluating every ${intervalMinutes} minutes.`);
  } catch (error) {
    console.error('Error initializing pricing scheduler:', error.message);
  }
};

// Reschedule function called by Admin config edits
const reschedulePricingTicks = (newIntervalMinutes, io) => {
  if (pricingIntervalRef) {
    clearInterval(pricingIntervalRef);
  }

  pricingIntervalRef = setInterval(() => {
    runPricingEvaluation(io);
  }, newIntervalMinutes * 60 * 1000);

  console.log(`Pricing scheduler rescheduled to run every ${newIntervalMinutes} minutes.`);
};

module.exports = {
  initPricingScheduler,
  reschedulePricingTicks,
  runPricingEvaluation, // Allow manual trigger for dashboard checkouts or testing
};
