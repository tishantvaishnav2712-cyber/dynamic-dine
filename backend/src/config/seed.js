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
        password: 'Admin@12345', // This will be automatically hashed by User model pre-save hook
        role: 'admin',
        phone: '1234567890',
      });
      console.log('Seeded default admin: admin@dynamicdine.com / Admin@12345');
    }

    // 2. Seed exactly 10 tables if table count is 0
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tables = [];
      const capacities = [2, 2, 4, 4, 4, 4, 6, 6, 8, 10]; // Varying capacities for Table 1 to 10
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
        demandThresholdIncrease: 5,     // Threshold count for increase
        demandThresholdDecrease: 2,     // Threshold count for decrease
        priceIncreasePercent: 2.5,      // +2.5% (Halved from 5.0%)
        priceDecreasePercent: 1.5,      // -1.5% (Halved from 3.0%)
        fixedIncreaseAmount: 0.00,
        fixedDecreaseAmount: 0.00,
        demandWindowMinutes: 5,        // Small window (5 min) for active demo responsiveness
        cronIntervalMinutes: 1,         // Run pricing calculations every 1 minute for demo
        maxPriceChangePerUpdatePercent: 7.5,  // Halved from 15.0%
      });
      console.log('Seeded default dynamic pricing configuration');
    }

    // 4. Seed Categories and Products
    const Category = require('../models/Category');
    const Product = require('../models/Product');

    let fastFoodCat = await Category.findOne({ name: 'Burgers & Sides' });
    if (!fastFoodCat) {
      fastFoodCat = await Category.create({
        name: 'Burgers & Sides',
        description: 'Delicious burgers, loaded fries, and starters'
      });
      console.log('Seeded Category: Burgers & Sides');
    }

    let beveragesCat = await Category.findOne({ name: 'Beverages' });
    if (!beveragesCat) {
      beveragesCat = await Category.create({
        name: 'Beverages',
        description: 'Chilled mocktails, sodas, and shakes'
      });
      console.log('Seeded Category: Beverages');
    }

    const defaultItems = [
      {
        name: 'Classic Cheeseburger',
        category: fastFoodCat._id,
        description: 'Juicy flame-grilled beef patty, melted cheddar cheese, lettuce, tomato, and house burger sauce.',
        basePrice: 199.00,
        currentPrice: 199.00,
        minPrice: 159.00,
        maxPrice: 399.00,
        stock: 50
      },
      {
        name: 'Loaded Cheese Fries',
        category: fastFoodCat._id,
        description: 'Crispy golden French fries topped with hot melted cheese sauce, jalapeños, and green onions.',
        basePrice: 149.00,
        currentPrice: 149.00,
        minPrice: 119.00,
        maxPrice: 299.00,
        stock: 40
      },
      {
        name: 'Mint Mojito',
        category: beveragesCat._id,
        description: 'Refreshing blend of fresh mint leaves, lime juice, white sugar, soda, and crushed ice.',
        basePrice: 119.00,
        currentPrice: 119.00,
        minPrice: 89.00,
        maxPrice: 249.00,
        stock: 100
      }
    ];

    for (const item of defaultItems) {
      const exists = await Product.findOne({ name: item.name });
      if (!exists) {
        await Product.create(item);
        console.log(`Seeded Product: ${item.name}`);
      }
    }

  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
