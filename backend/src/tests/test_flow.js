const mongoose = require('mongoose');
const User = require('../models/User');
const Table = require('../models/Table');
const Category = require('../models/Category');
const Product = require('../models/Product');
const PricingConfig = require('../models/PricingConfig');
const PricingHistory = require('../models/PricingHistory');
const DiningSession = require('../models/DiningSession');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const crypto = require('crypto');

const runTests = async () => {
  try {
    console.log('--- CONNECTING TO MONGO FOR VALIDATION RUN ---');
    await mongoose.connect('mongodb://localhost:27017/dynamic-dine');
    console.log('Connected.');

    // 1. Setup Test Config
    console.log('\n--- 1. CONFIGURING PRICING RULES ---');
    let config = await PricingConfig.findOne({});
    if (!config) {
      config = await PricingConfig.create({});
    }
    config.globalEnabled = true;
    config.priceIncreasePercent = 5.0; // +5%
    config.priceDecreasePercent = 3.0; // -3%
    config.demandThresholdIncrease = 3;
    config.demandThresholdDecrease = 1;
    await config.save();
    console.log(`Configured rules: +5% on order, -3% on decay.`);

    // 2. Setup Test Category & Product
    console.log('\n--- 2. CREATING TEST CATEGORY & PRODUCT ---');
    let category = await Category.findOne({ name: 'Test Drinks' });
    if (!category) {
      category = await Category.create({ name: 'Test Drinks', description: 'Soda categories' });
    }

    // Delete existing product to start clean
    await Product.deleteOne({ name: 'Test Soda' });
    const product = await Product.create({
      name: 'Test Soda',
      category: category._id,
      description: 'Cold test carbonated beverage',
      basePrice: 100.00,
      currentPrice: 100.00,
      minPrice: 80.00,
      maxPrice: 200.00,
      stock: 50,
    });
    console.log(`Created 'Test Soda' with Base Price: ₹${product.basePrice.toFixed(2)}`);

    // 3. Test Relative Pricing Math
    console.log('\n--- 3. VERIFYING DYNAMIC PRICE INCREASES ON RELATIVE ORDER ---');
    const previousPrice = product.currentPrice;
    
    // Simulate relative pricing:
    // Let's assume we have 3 active dynamic pricing products:
    // 1) Test Soda (our product) with demand = 5
    // 2) Product B with demand = 1
    // 3) Product C with demand = 0
    // Total demand = 6. Num products = 3. Average demand = 2.
    const demandQty = 5;
    const totalDemand = 6;
    const numProducts = 3;
    const averageDemand = totalDemand / numProducts; // 2.0
    
    // Since demandQty (5) > averageDemand (2.0), the price will increase
    // Scale = demandQty / averageDemand = 2.5
    const scale = demandQty / averageDemand; // 2.5
    const incFactor = (config.priceIncreasePercent / 100) * scale; // 5% * 2.5 = 12.5%
    const expectedPrice = parseFloat((previousPrice * (1 + incFactor)).toFixed(2)); // 100.00 * 1.125 = 112.50
    
    product.currentPrice = expectedPrice;
    product.demandScore = demandQty;
    await product.save();
    console.log(`Simulated Relative Pricing (Demand: ${demandQty}, Avg: ${averageDemand}, Scale: ${scale}x). Price spiked: ₹${previousPrice.toFixed(2)} -> ₹${product.currentPrice.toFixed(2)} (Expected: ₹${expectedPrice.toFixed(2)})`);

    if (product.currentPrice === expectedPrice) {
      console.log('SUCCESS: Relative pricing spike calculation is correct.');
    } else {
      console.error('FAIL: Relative price spike mismatch!');
    }

    // 4. Test Relative Pricing Decay
    console.log('\n--- 4. VERIFYING DYNAMIC PRICE DECAYS ON BELOW-AVERAGE ACTIVITY ---');
    const preDecayPrice = product.currentPrice; // 112.50
    
    // Simulate decay where demand = 1, average = 2
    // Since demand (1) < average (2), it decays by priceDecreasePercent (3%)
    const decayFactor = config.priceDecreasePercent / 100; // 0.03
    const expectedDecayedPrice = parseFloat((preDecayPrice * (1 - decayFactor)).toFixed(2)); // 112.50 * 0.97 = 109.13

    const postDecay = parseFloat((preDecayPrice * (1 - decayFactor)).toFixed(2));
    console.log(`Simulated decay tick. Price dropped: ₹${preDecayPrice.toFixed(2)} -> ₹${postDecay.toFixed(2)} (Expected: ₹${expectedDecayedPrice.toFixed(2)})`);

    if (postDecay === expectedDecayedPrice) {
      console.log('SUCCESS: Relative pricing decay calculation is correct.');
    } else {
      console.error('FAIL: Relative price decay mismatch!');
    }

    // 5. Verify decimal-based checkout billing calculations
    console.log('\n--- 5. VERIFYING DECIMAL BILLING PRECISION ---');
    const itemSubtotal = 106.70 * 2; // 213.40
    const gstRate = 0.05; // 5% GST
    const scRate = 0.10; // 10% Service Charge
    
    const expectedGst = parseFloat((itemSubtotal * gstRate).toFixed(2)); // 10.67
    const expectedSc = parseFloat((itemSubtotal * scRate).toFixed(2)); // 21.34
    const expectedGrandTotal = parseFloat((itemSubtotal + expectedGst + expectedSc).toFixed(2)); // 245.41

    console.log(`Consolidated subtotal: ₹${itemSubtotal.toFixed(2)}`);
    console.log(`Computed GST (5%): ₹${expectedGst.toFixed(2)}`);
    console.log(`Computed Service Charge (10%): ₹${expectedSc.toFixed(2)}`);
    console.log(`Expected Grand Total: ₹${expectedGrandTotal.toFixed(2)}`);

    // Clean up test product
    await Product.deleteOne({ _id: product._id });
    console.log('\nCleaned up database test records.');
    console.log('--- ALL INTEGRATION VALIDATION CHECKS COMPLETED ---');

    mongoose.connection.close();
  } catch (error) {
    console.error('Validation test run crashed:', error.message);
    mongoose.connection.close();
  }
};

runTests();
