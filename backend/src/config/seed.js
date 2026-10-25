const User = require('../models/User');
const Table = require('../models/Table');
const PricingConfig = require('../models/PricingConfig');

const seedDatabase = async () => {
  try {
    // 1. Seed Admin User if none exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      await User.create({
        name: 'System Admin',
        email: 'admin@dynamicdine.com',
        password: 'Admin@12345', // Automatically hashed by User pre-save hook
        role: 'admin',
        phone: '1234567890',
      });
      console.log('Seeded default admin: admin@dynamicdine.com / Admin@12345');
    }

    // 2. Seed exactly 10 tables if table count is 0
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tables = [];
      const capacities = [2, 2, 4, 4, 4, 4, 6, 6, 8, 10];
      for (let i = 1; i <= 10; i++) {
        tables.push({
          tableNumber: i,
          capacity: capacities[i - 1] || 4,
          status: 'available',
          currentSessionId: null,
          qrCodeData: `TABLE_${i}_TOKEN_UNASSIGNED`,
        });
      }
      await Table.insertMany(tables);
      console.log('Seeded exactly 10 tables (Table 1 to Table 10)');
    }

    // 3. Seed default Pricing Configuration if none exists
    const configCount = await PricingConfig.countDocuments();
    if (configCount === 0) {
      await PricingConfig.create({
        globalEnabled: true,
        demandThresholdIncrease: 5,
        demandThresholdDecrease: 2,
        priceIncreasePercent: 2.5,
        priceDecreasePercent: 1.5,
        fixedIncreaseAmount: 0.00,
        fixedDecreaseAmount: 0.00,
        demandWindowMinutes: 5,
        cronIntervalMinutes: 1,
        maxPriceChangePerUpdatePercent: 7.5,
      });
      console.log('Seeded default dynamic pricing configuration');
    }

    // 4. Seed Categories and Products (Preserves custom pictures permanently)
    const Category = require('../models/Category');
    const Product = require('../models/Product');
    const menuData = require('./menuData');

    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log(`Database contains ${productCount} products. Skipping seeding to permanently preserve your customized images and dishes.`);
      return;
    }

    console.log('Database empty. Seeding default menu with your customized dish pictures...');

    let totalDishes = 0;
    for (const catData of menuData) {
      const categoryDoc = await Category.create({
        name: catData.category,
        description: catData.description || '',
      });

      for (const item of catData.items) {
        const bPrice = item.basePrice || item.price || 100;
        const cPrice = item.currentPrice || bPrice;
        const minPrice = item.minPrice || Math.round(bPrice * 0.75);
        const maxPrice = item.maxPrice || Math.round(bPrice * 1.45);

        await Product.create({
          name: item.name,
          category: categoryDoc._id,
          description: item.description || '',
          image: item.image || '',
          basePrice: bPrice,
          currentPrice: cPrice,
          minPrice: minPrice,
          maxPrice: maxPrice,
          stock: item.stock !== undefined ? item.stock : 100,
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
          dynamicPricingEnabled: item.dynamicPricingEnabled !== undefined ? item.dynamicPricingEnabled : true,
          demandScore: 0,
        });
        totalDishes++;
      }
    }
    console.log(`Successfully seeded all ${menuData.length} categories and ${totalDishes} dishes with customized pictures!`);
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
