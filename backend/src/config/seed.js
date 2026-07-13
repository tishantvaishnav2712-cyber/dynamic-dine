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

    const seedCategory = async (name, description) => {
      let cat = await Category.findOne({ name });
      if (!cat) {
        cat = await Category.create({ name, description });
        console.log(`Seeded Category: ${name}`);
      }
      return cat;
    };

    // Wipe all existing categories and products to start completely fresh
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared all existing Categories and Products from database.');

    // Seed Categories
    const beveragesCat = await seedCategory('Beverages', 'Refreshing mojitos, sodas, and mocktails');
    const chineseCat = await seedCategory('Chinese & Oriental', 'Hakka noodles, fried rice, and stir-fry main course dishes');
    const startersCat = await seedCategory('Starters', 'Delicious global and Indian starters');
    const soupCat = await seedCategory('Soup', 'Creamy, spicy and clear vegetarian soups');
    
    // 1. Seed Mint Mojito
    let mintMojito = await Product.findOne({ name: 'Mint Mojito' });
    if (!mintMojito) {
      mintMojito = await Product.create({
        name: 'Mint Mojito',
        category: beveragesCat._id,
        description: 'Refreshing blend of fresh mint leaves, lime juice, white sugar, soda, and crushed ice.',
        basePrice: 119.00,
        currentPrice: 119.00,
        minPrice: 89.00,
        maxPrice: 249.00,
        stock: 100,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80'
      });
      console.log('Seeded Mint Mojito.');
    }

    // 2. Seed Veg. Hakka Noodles
    let hakkaNoodles = await Product.findOne({ name: 'Veg. Hakka Noodles' });
    if (!hakkaNoodles) {
      await Product.create({
        name: 'Veg. Hakka Noodles',
        category: chineseCat._id,
        description: 'Classic Hakka style noodles tossed with cabbage, carrot, bell peppers, onions, and light soy sauce.',
        basePrice: 280.00,
        currentPrice: 280.00,
        minPrice: 199.00,
        maxPrice: 399.00,
        stock: 100,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80'
      });
      console.log('Seeded Veg. Hakka Noodles.');
    }

    // 3. Seed Cheese Garlic Bread
    let garlicBread = await Product.findOne({ name: 'Cheese Garlic Bread' });
    if (!garlicBread) {
      await Product.create({
        name: 'Cheese Garlic Bread',
        category: startersCat._id,
        description: 'Freshly toasted French loaf slices topped with garlic butter and melted mozzarella cheese.',
        basePrice: 299.00,
        currentPrice: 299.00,
        minPrice: 199.00,
        maxPrice: 399.00,
        stock: 100,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80'
      });
      console.log('Seeded Cheese Garlic Bread.');
    }

    // 4. Seed Jalapeno Cheese Soup
    let cheeseSoup = await Product.findOne({ name: 'Jalapeno Cheese Soup' });
    if (!cheeseSoup) {
      await Product.create({
        name: 'Jalapeno Cheese Soup',
        category: soupCat._id,
        description: 'A rich, creamy cheddar cheese soup cooked with carrots, yellow onions, and sliced jalapeno peppers.',
        basePrice: 200.00,
        currentPrice: 200.00,
        minPrice: 149.00,
        maxPrice: 299.00,
        stock: 100,
        image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=400&q=80'
      });
      console.log('Seeded Jalapeno Cheese Soup.');
    }
    return; // Exit early so no other items are seeded
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
