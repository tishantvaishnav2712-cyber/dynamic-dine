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

    const mexicanCat = await seedCategory('Mexican Bar', 'Mexican snacks, tacos, enchiladas, and rice dishes');
    const rostiCat = await seedCategory('Rosti Bar', 'Traditional Swiss potato rosti dishes');
    const chineseCat = await seedCategory('Chinese & Oriental', 'Hakka noodles, fried rice, and stir-fry main course dishes');
    const bakedCat = await seedCategory('Baked Dish', 'Delicious baked macaroni, lasagna, cannelloni, and gratins');
    const startersCat = await seedCategory('Indian Starters', 'Tandoori platters, paneer tikkas, and kebabs');
    const risottoCat = await seedCategory('Risotto Bar', 'Arborio rice risottos with premium herbs and sauces');
    const italianCat = await seedCategory('Italian Bar', 'Premium pastas, spaghetti, and sauces');
    const continentalCat = await seedCategory('Continental', 'Continental skillets, stroganoff, and diced paneer');
    const pizzaCat = await seedCategory('Pizza Bar', 'Freshly baked hand-tossed pizzas');
    const loafCat = await seedCategory('Fresh Loaf Bar', 'Stuffed and topped fresh bread loaves');
    const gardenCat = await seedCategory('Fresh Garden', 'Fresh garden salads, raitas, and papads');
    const paneerCat = await seedCategory('Signature Paneer', 'Exclusive gourmet paneer specialties');
    const vegCat = await seedCategory('Signature Vegetable', 'Premium vegetarian handis, kadas, and curries');
    const kajuCat = await seedCategory('Kaju & Kofta', 'Rich cashew curries and vegetarian koftas');
    const dalCat = await seedCategory('Dal Preparation', 'Yellow dal fry, dal makhani, and regional dal specials');
    const riceCat = await seedCategory('Rice Preparation', 'Biryanis, pulaos, and steamed rice options');
    const breadsCat = await seedCategory('Indian Breads', 'Tandoori rotis, naans, parathas, and kulchas');
    const shakesCat = await seedCategory('Milkshakes', 'Thick creamy milkshakes');
    const dessertsCat = await seedCategory('Desserts', 'Hot brownies, mud pies, and sweet treats');

    const defaultItems = [
      // Mexican Bar
      { name: 'Cottage Cheese San Margo', category: mexicanCat._id, description: 'Diced Cut Baby Corn, Cottage Cheese, Coloured Bell Pepper, Onion And Garlic Tossed In Olive Oil With Neapolitan Sauce And Cheese Served With Garlic Bread.', basePrice: 399.00 },
      { name: 'Veg. Chilaquiles', category: mexicanCat._id, description: 'Finger Shaped Cottage Cheese Tossed In Poblano Sauce, Served With Garlic Bread.', basePrice: 399.00 },
      { name: 'Veg. Corn Enchiladas', category: mexicanCat._id, description: 'Baked Dish From The Bed Of Mexico.', basePrice: 399.00 },
      { name: 'Mexican Rice With Salsa Curry', category: mexicanCat._id, description: 'Most Popular Rice Cooked With Beans And Mexican Species Served With Salsa Curry.', basePrice: 340.00 },
      { name: 'Mexican Lemon Cilantro Rice With Beans Curry', category: mexicanCat._id, description: 'House Favourite Rice Tossed With Coloured Bell Pepper, Kidney Beans, Cilantro And Spinach Paste Added Mexican Spices.', basePrice: 399.00 },
      { name: 'Foil Cooked Mexican Chilli Paneer With Rice', category: mexicanCat._id, description: 'House Favourite Rice Tossed With Coloured Bell Pepper, American Corn, Rajma Added Mexican Spices And Topped With Red Sauce And Paneer Pieces.', basePrice: 440.00 },
      { name: 'Mexican Hot Pot Rice', category: mexicanCat._id, description: 'House Favourite Rice Tossed With Coloured Bell Pepper, American Corn, Rajma Added Mexican Spices And Topped With Salsa And Nachos.', basePrice: 440.00 },

      // Rosti Bar
      { name: 'Potato Cheese Rosti', category: rostiCat._id, description: 'Balanced Potato Waffer With Italian Spices And Herbs Topped With Processed Cheese Served With Salsa Curry And Sour Cream.', basePrice: 360.00 },
      { name: 'Banana Cheese Rosti', category: rostiCat._id, description: 'Balanced Raw Banana With Italian Spices And Herbs Topped With Processed Cheese Served With Salsa Curry And Sour Cream.', basePrice: 360.00 },
      { name: 'Noodle Rosti', category: rostiCat._id, description: 'Fresh Noodles With Italian Spices And Herbs Topped With Processed Cheese Served With Salsa Curry And Sour Cream.', basePrice: 360.00 },

      // Chinese / Oriental Maincourse
      { name: 'Veg. Fried Rice', category: chineseCat._id, description: 'Classic wok-tossed fried rice with chopped fresh vegetables.', basePrice: 250.00 },
      { name: 'Veg. Hakka Noodles', category: chineseCat._id, description: 'Classic Hakka style noodles tossed with cabbage, carrot, bell peppers and onions.', basePrice: 280.00 },
      { name: 'Veg. Singapore Noodles', category: chineseCat._id, description: 'Singapore style thin noodles tossed with curry powder and fresh greens.', basePrice: 280.00 },
      { name: 'Wok Style Noodles', category: chineseCat._id, description: 'Noodles tossed in high flame with signature Chinese dark soy and spices.', basePrice: 280.00 },
      { name: 'Pad Thai Noodles', category: chineseCat._id, description: 'Flat rice noodles tossed in sweet-tangy tamarind sauce, sprouts and peanuts.', basePrice: 320.00 },
      { name: 'Malaysian Style Noodles', category: chineseCat._id, description: 'Malaysian style thick noodles with aromatic spices and coconut essence.', basePrice: 320.00 },
      { name: 'Stirred Fried Veg. In Schezwan Sauce With Wok Style', category: chineseCat._id, description: 'Stir fried fresh garden vegetables tossed in fiery house-made Schezwan sauce.', basePrice: 380.00 },
      { name: 'Stirred Fried Veg. In Hunan Sauce', category: chineseCat._id, description: 'Stir fried vegetables in sweet-spicy dark Hunan style sauce.', basePrice: 380.00 },
      { name: 'Stirred Fried Veg. In Hot Garlic Sauce', category: chineseCat._id, description: 'Assorted vegetables stir-fried in pungent, rich hot garlic sauce.', basePrice: 380.00 },
      { name: 'Stirred Fried Veg. In Black Beans Sauce', category: chineseCat._id, description: 'Fresh vegetables tossed in fermented black bean sauce with bell peppers.', basePrice: 380.00 },
      { name: 'Thai Vegetables In Red Curry', category: chineseCat._id, description: 'Aromatic spicy red Thai curry with coconut milk, lemongrass and fresh vegetables.', basePrice: 360.00 },
      { name: 'Thai Vegetables In Green Curry', category: chineseCat._id, description: 'Creamy green Thai curry with fresh herbs, green chillies and vegetables.', basePrice: 360.00 },
      { name: 'Thai Vegetables In Yellow Curry', category: chineseCat._id, description: 'Mild yellow Thai curry with turmeric, mild spices, coconut milk and vegetables.', basePrice: 360.00 },

      // Baked Dish
      { name: 'Baked Cheese Macaroni With Pineapple', category: bakedCat._id, description: 'Macaroni and sweet pineapple baked in rich, creamy cheese sauce.', basePrice: 299.00 },
      { name: 'Baked Spaghetti', category: bakedCat._id, description: 'Spaghetti pasta tossed in tomato sauce, topped with mozzarella and baked.', basePrice: 299.00 },
      { name: 'Baked Vegetable Au Gratin', category: bakedCat._id, description: 'Assorted parboiled vegetables baked under a thick layer of golden cheese.', basePrice: 299.00 },
      { name: 'Baked Chilli Corn', category: bakedCat._id, description: 'Sweet corn kernels tossed with green chillies, topped with cheese and baked.', basePrice: 299.00 },
      { name: 'Veg. Lasagna', category: bakedCat._id, description: 'Classic baked layered pasta sheets with vegetable ragout, bechamel and cheese.', basePrice: 360.00 },
      { name: 'Tripple Layered Classic Lasagna', category: bakedCat._id, description: 'Chef special three-layered lasagna with multi-sauce vegetable filling and mozzarella.', basePrice: 399.00 },
      { name: 'Baked Cannelloni', category: bakedCat._id, description: 'Rolled pasta sheets stuffed with spinach and ricotta, baked in tomato-cream base.', basePrice: 399.00 },

      // Indian Starters
      { name: 'Special Barbeque (Exclusive For Dream Dining)', category: startersCat._id, description: 'Two Flavor Of Cottage Cheese Malai Tikka, Paneer Tikka Baby Corn, Mushroom, Baby Potato, American Corn Served With Kachumber Salad And Green Chutney.', basePrice: 499.00 },
      { name: 'Tandoori Platter', category: startersCat._id, description: 'Combination Of Corn Tikki, Hariyali Tikki, Raja Kebab, Two Flavoured Tikka, Served With Kachumber And Green Chutney.', basePrice: 499.00 },
      { name: 'Basil Paneer Tikka / Paneer Tikka Dry', category: startersCat._id, description: 'Cubes Of Cottage Cheese, Onion, Capsicum And Tomato Marinated With Pesto Sauce Added Tandoori Spices And Grilled Served With Kachumber And Green Chutney.', basePrice: 350.00 },
      { name: 'Multani Paneer Tikka', category: startersCat._id, description: 'Cottage Cheese In Sandwich Base Sheet With Mint Flavour, Added Tandoori Spices And Grilled, Served With Kachumber And Green Chutney.', basePrice: 380.00 },
      { name: 'Shikampuri Kebab', category: startersCat._id, description: 'Blanched And Crushed Soyabean, Smoked Vadi Added Tandoori Spices And Deep Fried Served With Kachumber And Green Chutney.', basePrice: 300.00 },
      { name: 'Corn Tikki', category: startersCat._id, description: 'American Corn Crushed, Sauteed In Pan With Added Indian Spices, Deep Fried And Served With Green Chutney And Salad.', basePrice: 280.00 },
      { name: 'Hara Bhara Kebab', category: startersCat._id, description: 'Indian Chopped Vegetable, Chopped Spinach Soaked In Pan Added With Indian Spices, Purple Yam And Raw Banana, Deep Fried And Served With Green Chutney And Salad.', basePrice: 280.00 },
      { name: 'Pudina Tikka', category: startersCat._id, description: 'Cubes Of Paneer Marinated In Crushed Mint, Indian Spices, Curd And Added Flavour Roasted In Tandoor And Served With Chutney And Tandoori Kachumbar.', basePrice: 320.00 },
      { name: 'Paneer Malai Tikka', category: startersCat._id, description: 'Yummy Cubes Of Paneer Marinated In Crushed Cardamom, Indian Spices, Curd And Added Flavour Roasted In Tandoor And Served With Chutney And Tandoori Kachumbar.', basePrice: 360.00 },
      { name: 'Teel Stick Kebab', category: startersCat._id, description: 'Kebab Made Of Raw Banana, Chopped Bell Peppers, Sesame, Indian Spices And Added Flavour Served With Chutney And Salad.', basePrice: 320.00 },

      // Risotto Bar
      { name: 'Sun Dried Tomato Risotto', category: risottoCat._id, description: 'Arborio Rice Flavoured With A Smoothy Creamy Cheese Sauce Sauteed With Onion, Garlic, Leek, Celery And Sun Dried Tomato With Added Spices.', basePrice: 299.00 },
      { name: 'Four Cheese Risotto', category: risottoCat._id, description: 'Cream And Cheese Added Arborio Rice Cooked With Italian Seasoning With Four Cheese Garnished With Parsley.', basePrice: 299.00 },
      { name: 'Pesto Risotto', category: risottoCat._id, description: 'Arborio Rice Flavoured With A Smooth Creamy Cheese Sauce Sauteed With Onion, Garlic, Leek, Celery, And Sun-dried Tomato With Added Spices In Pesto Sauce.', basePrice: 320.00 },

      // Italian Bar
      { name: 'Penne/Fusilli/Farfalle Pasta With Tomato Basil Sauce', category: italianCat._id, description: 'Tossed In A Rich Tomato Concasse With Basil That Lends A Remarkable Lingering Flavour.', basePrice: 399.00 },
      { name: 'Penne/Fusilli/Farfalle Pasta With Alfredo Cheese Sauce', category: italianCat._id, description: 'Combination Of Pasta Tossed With Cheese Sauce Sprinkled With Parmesan Cheese.', basePrice: 399.00 },
      { name: 'Penne/Fusilli/Farfalle Pasta With Creole Sauce', category: italianCat._id, description: 'Combination Of Pasta Tossed With Alfredo And Tomato Basil Sauce Flavoured With Parmesan Cheese.', basePrice: 399.00 },
      { name: 'Penne Pesto', category: italianCat._id, description: 'Combination Of Pasta Tossed With Corse Sauce Made Of Basil, Nuts, Parmesan Cheese, Garlic, And Olive Oil.', basePrice: 399.00 },
      { name: 'Spaghetti Aglio E Olio', category: italianCat._id, description: 'Garlic, Olive Oil, Parsley and Cheese Tossed With Cooked Pasta', basePrice: 399.00 },
      { name: 'Spaghetti And Grilled Vegetables In Tomato Sauce', category: italianCat._id, description: 'Spaghetti Tossed With Vinegar And Garlic, Grilled Zucchini, Mushrooms And Red Bell Pepper In Tomato Basil Sauce, Served Regular Or Saucy.', basePrice: 399.00 },
      { name: 'Penne/Fusilli/Farfalle Pasta With Four Cheese Sauce', category: italianCat._id, description: 'Mix Pasta Tossed In A Rich Cheesy Sauce Made Of Gorgonzola, Parmesan, Cheddar, Mozzarella Cheese.', basePrice: 399.00 },

      // Continental
      { name: 'Garden Skillet', category: continentalCat._id, description: 'House Favourite Baby Corn, Coloured Bell Pepper, Baby Potato, Carrot And Broccoli Tossed In Olive Oil Served With Sauce And Accompanied With Garlic Bread.', basePrice: 360.00 },
      { name: 'Diced Paneer', category: continentalCat._id, description: 'Diced Paneer Tossed With Spices And Served With Paprika Sauce Accompanied With Garlic Bread.', basePrice: 360.00 },
      { name: 'Veg. Chaupitas', category: continentalCat._id, description: 'Diced Cut English Vegetables, Baby Corn, Cottage Cheese, Broccoli, Garlic And Served With Creole Sauce Accompanied With Butter Capsicum Rice.', basePrice: 399.00 },
      { name: 'Baby Corn Stroganoff', category: continentalCat._id, description: 'Combination Of Baby Corn, Bell Pepper, Onion Cooked In Brown Pepper Sauce Accompanied With Rice.', basePrice: 399.00 },

      // Pizza Bar
      { name: 'Italian Pizza', category: pizzaCat._id, description: 'Thin Julienne Of Coloured Bell Pepper, Onion, Tomato, Green-Black Olives, Jalapeno With Tomato Sauce Topped With Mozzarella Cheese.', basePrice: 299.00 },
      { name: 'Barbeque Pizza', category: pizzaCat._id, description: 'Bbq Sauce With Roasted Cottage Cheese, Baby Corn, Mushroom, Green-Black Olives, Jalapeno, Topped With Mozzarella Cheese.', basePrice: 299.00 },
      { name: 'Margherita Pizza', category: pizzaCat._id, description: 'A Cheesy Pizza Sauce Topping With Basil Leaf & Mozzarella Cheese.', basePrice: 299.00 },
      { name: 'Neapolitan Pizza', category: pizzaCat._id, description: 'Chopped Spinach, Baby Corn, Cubes Cutting Of Coloured Bell Pepper, Sliced Mushroom, Green-Black Olives, Jalapeno, With Pizza Sauce Topped With Mozzarella Cheese And Baked.', basePrice: 299.00 },

      // Fresh Loaf Bar
      { name: 'Italian Loaf', category: loafCat._id, description: 'Penne Pasta In Alfredo Sauce Stuffed In Italian Loaf And Topped With Mozzarella Cheese', basePrice: 320.00 },
      { name: 'Mexican Loaf', category: loafCat._id, description: 'Mexican Rice Stuffed In Loaf, Topped With Mozzarella Cheese And Baked.', basePrice: 320.00 },

      // Fresh Garden Salad/Raita/Papad
      { name: 'Julienne Salad', category: gardenCat._id, description: 'Julienne cut fresh garden vegetables in light vinaigrette dressing.', basePrice: 160.00 },
      { name: 'Green Salad', category: gardenCat._id, description: 'Sliced fresh cucumber, tomatoes, carrots, and onions served with lime.', basePrice: 160.00 },
      { name: 'Russian Salad', category: gardenCat._id, description: 'Diced boiled vegetables, apple, pineapple tossed in rich mayonnaise.', basePrice: 240.00 },
      { name: 'Waldorf Salad', category: gardenCat._id, description: 'Fresh celery, apples, walnuts, and grapes in creamy light dressing.', basePrice: 300.00 },
      { name: 'Caesar Salad', category: gardenCat._id, description: 'Crisp romaine lettuce, croutons, and parmesan dressed with Caesar dressing.', basePrice: 250.00 },
      { name: 'Lettuce Salad', category: gardenCat._id, description: 'Assorted crisp lettuce leaves tossed with chef special dressing.', basePrice: 300.00 },
      { name: 'Mix Pasta Salad', category: gardenCat._id, description: 'Boiled pasta and fresh vegetables tossed in Italian dressing and herbs.', basePrice: 280.00 },
      { name: 'Peanut Chat Salad', category: gardenCat._id, description: 'Crunchy roasted peanuts tossed with chopped onions, tomatoes, and tangy spices.', basePrice: 280.00 },
      { name: 'Kachumber Salad', category: gardenCat._id, description: 'Finely chopped onion, tomato, cucumber with lime and spice seasoning.', basePrice: 170.00 },
      { name: 'Corn Potato Salad', category: gardenCat._id, description: 'Sweet corn kernels and diced potatoes in creamy herb dressing.', basePrice: 250.00 },
      { name: 'Veg. Raita', category: gardenCat._id, description: 'Whisked curd with chopped cucumber, tomato, onion and roasted cumin.', basePrice: 170.00 },
      { name: 'Boondi Raita', category: gardenCat._id, description: 'Crispy gram flour boondi soaked in seasoned whipped curd.', basePrice: 170.00 },
      { name: 'Tomato Cucumber Raita', category: gardenCat._id, description: 'Curd whipped with chopped fresh tomatoes and cucumber.', basePrice: 170.00 },
      { name: 'Pineapple Raita', category: gardenCat._id, description: 'Sweet and tangy raita with juicy pineapple chunks.', basePrice: 170.00 },
      { name: 'Plain Curd', category: gardenCat._id, description: 'Freshly set simple plain yogurt.', basePrice: 90.00 },
      { name: 'Roasted Papad', category: gardenCat._id, description: 'Crispy roasted lentil flatbread.', basePrice: 30.00 },
      { name: 'Fried Papad', category: gardenCat._id, description: 'Deep fried crispy lentil flatbread.', basePrice: 40.00 },
      { name: 'Masala Papad', category: gardenCat._id, description: 'Roasted papad topped with spicy onion, tomato, coriander mix.', basePrice: 60.00 },
      { name: 'Sev / Cheese Masala Papad', category: gardenCat._id, description: 'Roasted papad topped with cheese, sev, onion, tomato and spices.', basePrice: 100.00 },

      // Signature Paneer
      { name: 'Signature Paneer (Makhani Gravy)', category: paneerCat._id, description: 'Two Layers Of Coin Cutting Cottage Cheese With Chopped Spinach, Crushed American Corn, Cardamom, Grated Jaifal, Added Indian Spices Cooked In Rich Makhani Gravy Garnished With Grated Cottage Cheese And Coriander.', basePrice: 399.00 },
      { name: 'Paneer Bhurjee Lasagnia (Makhani Gravy)', category: paneerCat._id, description: 'Two Layers Of Cottage Sheet Stuffed With Paneer Bhurjee Dry Added Indian Spices And Baked, Topped With Rich Makhani Gravy Garnished With Grated Cottage Cheese And Coriander.', basePrice: 399.00 },
      { name: 'Paneer Barrel (Brown Gravy)', category: paneerCat._id, description: 'Stuff Paneer With Mawa, Cashew Nut, Cottage Cheese Added Spices Coated, Deep Fried And Cooked In Rich Brown Gravy Garnished With Grated Paneer And Chopped Coriander.', basePrice: 399.00 },
      { name: 'Paneer Rulate (Makhani Gravy)', category: paneerCat._id, description: 'Grated Cottage Cheese, Rich Mava, With Added Spices, Saffron Flavour Cooked In Rich Makhani Gravy Garnished With Grated Paneer And Chopped Coriander.', basePrice: 380.00 },
      { name: 'Paneer Khurchan (Brown Gravy)', category: paneerCat._id, description: 'Finger Cut Of Cottage Cheese And Coloured Bell Pepper Sauteed In Pan And Cooked In Rich Brown Gravy Added Indian Spices Garnished With Grated Paneer And Chopped Coriander.', basePrice: 380.00 },
      { name: 'Paneer Ichak Dana (Makhani Gravy)', category: paneerCat._id, description: 'Cubes Of Cottage Cheese, Coloured Bell Pepper, Basil Ajwain And Indian Spices Cooked In Rich Makhani Gravy Garnished With Grated Cottage Cheese And Coriander.', basePrice: 399.00 },
      { name: 'Burhani Dum Paneer', category: paneerCat._id, description: 'Square Cut Cottage Cheese Stuffed with Grated Cottage Cheese, Mava, Saffron, Added Indian Spices Deep Fried And Topped With Rich Makhani Gravy Served In Dum Pot.', basePrice: 410.00 },
      { name: 'Paneer Tikka Masala', category: paneerCat._id, description: 'Cottage Cheese Marinated In Indian Spices, Roasted And Cooked With Red Gravy And Garnished With Coriander.', basePrice: 299.00 },
      { name: 'Paneer Butter Masala', category: paneerCat._id, description: 'Square cut cottage cheese, added with Indian spices, Butter And Cooked In Red Gravy.', basePrice: 299.00 },
      { name: 'Paneer Tikka Lababdar', category: paneerCat._id, description: 'Finger Cut Roasted Cottage Cheese With Added Traditional Spices, Honey And Cooked In Red Gravy Garnished With Coriander And Honey.', basePrice: 350.00 },
      { name: 'Paneer Handi', category: paneerCat._id, description: 'Cube Of Cottage Cheese With Added Spices And Dice Cut Onion, Capsicum And Cooked In Brown Gravy.', basePrice: 310.00 },
      { name: 'Kadai Paneer', category: paneerCat._id, description: 'Cubes Of Cottage Cheese Onion, Capsicum, Red Chilli And Cooked In Red Gravy.', basePrice: 310.00 },
      { name: 'Paneer Khada Masala', category: paneerCat._id, description: 'Cubes Of Cottage Cheese Cooked In Brown Gravy With Added Khada Masala Prepared From Indian Traditional And Aromatic Spices.', basePrice: 320.00 },
      { name: 'Balti Paneer', category: paneerCat._id, description: 'Finger cut fried Cottage Cheese cooked in brown and red gravy, garnished with coriander.', basePrice: 320.00 },
      { name: 'Cheese Butter Masala', category: paneerCat._id, description: 'Cubes Of Cheese Cooked In Red Gravy With Added Spices, Butter And Topped With Cheese And Butter.', basePrice: 380.00 },

      // Signature Vegetable
      { name: 'Signature Vegetable', category: vegCat._id, description: 'Exotic Indian / English Vegetables Sauteed In Pan With Indian Spices Cooked In Rich Brown Gravy.', basePrice: 299.00 },
      { name: 'Veg. Nizami Handi', category: vegCat._id, description: 'Exotic Indian Vegetables With Chopped Spinach, American Corn Cooked In Spinach Gravy With Indian Spices.', basePrice: 299.00 },
      { name: 'Veg. Aneri-Ganeri', category: vegCat._id, description: 'Combination Of Fresh Methi, Palak, Green Peas, American Corn, Cooked In Spinach Gravy With Indian Spices.', basePrice: 299.00 },
      { name: 'Veg. Diwani Handi', category: vegCat._id, description: 'Exotic Indian Vegetables With Baby Corn, Mushroom, Diced Cutting Of Tomato Cooked In Spinach Gravy With Indian Spices.', basePrice: 299.00 },
      { name: 'Vegetable Afghani', category: vegCat._id, description: 'Diced Cut Mushroom, Vegetables, Capsicum, Onions And Baby Corn Cooked In Brown And Cashew Nuts Gravy.', basePrice: 310.00 },
      { name: 'Veg. Makhanwala', category: vegCat._id, description: 'Executive Indian Vegetable Cooked In Red Gravy With Added Spices.', basePrice: 280.00 },
      { name: 'Veg. Kadai', category: vegCat._id, description: 'Dice Cut Executive Indian Vegetable, Onion, Capsicum Cooked In Red Gravy With Added Kadhai Masala.', basePrice: 280.00 },
      { name: 'Veg. Khada Masala', category: vegCat._id, description: 'Executive Indian Vegetables Cooked In Brown Gravy With Added Khada Masala Prepared From Indian Traditional And Aromatic Spices.', basePrice: 280.00 },
      { name: 'Veg. Jaipuri', category: vegCat._id, description: 'Julienne\'s Of Executive Vegetable, Onion, Capsicum Cooked In Brown Gravy.', basePrice: 280.00 },
      { name: 'Veg. Kolhapuri', category: vegCat._id, description: 'Dice Cut Capsicum, Onion, Mix Vegetables Cooked In Red Gravy And Garnished With Coriander.', basePrice: 280.00 },
      { name: 'Veg. Hydrabadi', category: vegCat._id, description: 'Cube Cut Executive Vegetables Cooked In Spinach Gravy With Added Spices And Touch Of Mint And Coriander.', basePrice: 280.00 },
      { name: 'Navratan Korma (sweet)', category: vegCat._id, description: 'Executive Vegetables And Fruits Cooked In White Gravy With Added Sugar And Flavonoids.', basePrice: 299.00 },

      // Kaju / Kofta's
      { name: 'Nargisi Kofta', category: kajuCat._id, description: 'Crispy fried vegetable koftas in smooth rich brown gravy.', basePrice: 330.00 },
      { name: 'Cheese Angoori Kofta', category: kajuCat._id, description: 'Small grape-sized cheese paneer balls cooked in creamy tomato base.', basePrice: 320.00 },
      { name: 'Cheese Kofta', category: kajuCat._id, description: 'Classic cheese and paneer dumplings cooked in rich yellow gravy.', basePrice: 320.00 },
      { name: 'Malai Kofta', category: kajuCat._id, description: 'Classic cottage cheese dumplings stuffed with dry fruits, in sweet-creamy white gravy.', basePrice: 320.00 },
      { name: 'Khoya Kaju (Sweet)', category: kajuCat._id, description: 'Khoya and whole cashews cooked in mildly sweet white cashew paste.', basePrice: 360.00 },
      { name: 'Kofta Saanj Savera', category: kajuCat._id, description: 'Paneer stuffed spinach dumplings in rich velvety tomato makhani gravy.', basePrice: 299.00 },
      { name: 'Kaju Curry', category: kajuCat._id, description: 'Roasted whole cashew nuts cooked in rich spiced tomato-onion gravy.', basePrice: 330.00 },
      { name: 'Kaju Masala', category: kajuCat._id, description: 'Cashews cooked in semi-dry spicy tomato masala base.', basePrice: 399.00 },
      { name: 'Kaju Kadai Masala / Kaju Butter Masala', category: kajuCat._id, description: 'Cashews in spiced kadai style gravy or rich buttery tomato gravy.', basePrice: 399.00 },

      // Dal Preparation
      { name: 'Yellow Dal Fry', category: dalCat._id, description: 'Yellow lentils cooked with tempered onion, tomatoes and basic spices.', basePrice: 200.00 },
      { name: 'Yellow Dal Tadka', category: dalCat._id, description: 'Yellow lentils tempered with ghee, garlic, red chillies and cumin.', basePrice: 220.00 },
      { name: 'Dal Makhani', category: dalCat._id, description: 'Black lentils slow-cooked overnight with cream, butter, and tomato paste.', basePrice: 280.00 },
      { name: 'Dal Panchrangi', category: dalCat._id, description: 'Mix of five regional lentils cooked with selected spices and ghee.', basePrice: 260.00 },
      { name: 'Dal Pahadi', category: dalCat._id, description: 'Himachali style green lentils cooked with fresh herbs, ginger and garlic.', basePrice: 270.00 },

      // Rice Preparation
      { name: 'Steamed Rice', category: riceCat._id, description: 'Fluffy steamed premium long-grain Basmati rice.', basePrice: 199.00 },
      { name: 'Jeera Rice', category: riceCat._id, description: 'Basmati rice tossed with roasted cumin seeds and ghee.', basePrice: 220.00 },
      { name: 'Veg. Pulao', category: riceCat._id, description: 'Basmati rice cooked with fresh seasonal vegetables and mild spices.', basePrice: 230.00 },
      { name: 'Kashmiri Pulao', category: riceCat._id, description: 'Mildly sweet saffron Basmati rice garnished with dry fruits and fresh fruits.', basePrice: 250.00 },
      { name: 'Veg. Biryani', category: riceCat._id, description: 'Aromatic layered rice dish cooked with seasoned vegetables and herbs.', basePrice: 250.00 },
      { name: 'Veg. Dum Biryani', category: riceCat._id, description: 'Classic dum-cooked vegetables and long-grain Basmati rice with saffron.', basePrice: 299.00 },
      { name: 'Veg. Hydrabadi Biryani', category: riceCat._id, description: 'Spicy Hyderabadi style green masala rice cooked with vegetables.', basePrice: 280.00 },
      { name: 'Kesari Biryani', category: riceCat._id, description: 'Royal saffron-flavored Basmati rice layered with paneer and vegetables.', basePrice: 299.00 },
      { name: 'Kaju Pulao', category: riceCat._id, description: 'Basmati rice cooked with whole ghee-roasted cashew nuts.', basePrice: 299.00 },
      { name: 'Parda Dum Biryani', category: riceCat._id, description: 'Traditional biryani sealed and baked under a thin flour dough sheet.', basePrice: 350.00 },

      // Indian Breads
      { name: 'Tandoori Plain / Butter Roti', category: breadsCat._id, description: 'Classic Indian flatbread baked in tandoor.', basePrice: 50.00 },
      { name: 'Tandoori Plain / Butter Naan', category: breadsCat._id, description: 'Soft leavened flatbread baked in tandoor.', basePrice: 70.00 },
      { name: 'Plain / Butter Paratha', category: breadsCat._id, description: 'Layered whole wheat tandoori flatbread.', basePrice: 60.00 },
      { name: 'Plain / Butter Kulcha', category: breadsCat._id, description: 'Soft fluffy leavened flatbread.', basePrice: 70.00 },
      { name: 'Stuffed Paratha', category: breadsCat._id, description: 'Tandoori paratha stuffed with potato, paneer or mix veg.', basePrice: 120.00 },
      { name: 'Stuffed Naan', category: breadsCat._id, description: 'Tandoori naan stuffed with seasoned mashed potatoes or paneer.', basePrice: 150.00 },
      { name: 'Stuffed Kulcha', category: breadsCat._id, description: 'Fluffy kulcha stuffed with spiced vegetable mix.', basePrice: 150.00 },
      { name: 'Cheese Naan', category: breadsCat._id, description: 'Tandoori naan stuffed with processed cheese and butter.', basePrice: 180.00 },
      { name: 'Masala Cheese Naan', category: breadsCat._id, description: 'Naan stuffed with cheese and spices.', basePrice: 199.00 },
      { name: 'Garlic Naan', category: breadsCat._id, description: 'Leavened naan topped with minced fresh garlic and coriander.', basePrice: 180.00 },
      { name: 'Cheese Garlic Naan', category: breadsCat._id, description: 'Naan stuffed with cheese, topped with garlic and butter.', basePrice: 199.00 },
      { name: 'Basil Olive Naan', category: breadsCat._id, description: 'Naan topped with fresh basil and black olive slices.', basePrice: 180.00 },
      { name: 'Cheese Chilli Naan', category: breadsCat._id, description: 'Naan stuffed with cheese and topped with spicy green chillies.', basePrice: 199.00 },

      // Milkshakes
      { name: 'Vanilla / Strawberry Shake', category: shakesCat._id, description: 'Creamy cold shake with vanilla beans or fresh strawberry crush.', basePrice: 199.00 },
      { name: 'Chocolate / Banana / Chikoo Shake', category: shakesCat._id, description: 'Thick cold shake in chocolate, banana, or fresh chikoo flavors.', basePrice: 199.00 },

      // Desserts
      { name: 'Hot Sizzling Brownie', category: dessertsCat._id, description: 'Brownie Pastry Served On Sizzler Plate With Vanilla Ice-cream Topped With Hot Chocolate Sauce And Nuts.', basePrice: 320.00 },
      { name: 'Chocolate Mud Pie', category: dessertsCat._id, description: 'Crumbly chocolate mud crust pie with dense chocolate filling, served with vanilla ice cream and hot chocolate sauce.', basePrice: 399.00 },
      { name: 'Fried Ice Cream', category: dessertsCat._id, description: 'Ice Cream Coated In Flour With Corn Flakes And Deep Fried, Served With Hot Chocolate Sauce And Cashew Nuts.', basePrice: 299.00 },
      { name: 'Gulab Jamun - 4pcs', category: dessertsCat._id, description: 'Soft cottage cheese dumplings soaked in warm cardamom flavored sugar syrup.', basePrice: 160.00 },
      { name: 'Kala Jamun - 4pcs', category: dessertsCat._id, description: 'Dark, caramelised warm dumplings soaked in sweet syrup.', basePrice: 160.00 }
    ];

    for (const item of defaultItems) {
      const exists = await Product.findOne({ name: item.name });
      if (!exists) {
        await Product.create({
          ...item,
          currentPrice: item.basePrice,
          minPrice: item.minPrice || item.basePrice * 0.8,
          maxPrice: item.maxPrice || item.basePrice * 2.5,
          stock: 100 // Default starter stock
        });
        console.log(`Seeded Product: ${item.name}`);
      }
    }

  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
