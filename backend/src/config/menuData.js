// Full 13-category, 110-dish menu dataset
const menuData = [
  // 1. Soups
  {
    category: 'Soups',
    description: 'Warm, flavourful vegetarian soups prepared fresh with herbs and spices.',
    items: [
      {
        name: 'Cream of Mushroom',
        description: 'Creamy mushroom soup with herbs.',
        price: 169,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80'
      },
      {
        name: 'Roasted Tomato Basil',
        description: 'Slow-roasted tomatoes blended with fresh basil.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80'
      },
      {
        name: 'Sweet Corn Soup',
        description: 'Sweet corn, vegetables and mild seasoning.',
        price: 139,
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&q=80'
      },
      {
        name: 'Lemon Coriander Soup',
        description: 'Refreshing clear soup with lemon and coriander.',
        price: 139,
        image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&q=80'
      },
      {
        name: 'Veg Manchow Soup',
        description: 'Spicy Indo-Chinese soup topped with crispy noodles.',
        price: 159,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80'
      }
    ]
  },

  // 2. Starters & Appetizers
  {
    category: 'Starters & Appetizers',
    description: 'Crispy, smoky, and sizzling gourmet vegetarian appetizers and tandoori treats.',
    items: [
      {
        name: 'Crispy Corn Pepper Salt',
        description: 'Crunchy corn tossed with pepper and spices.',
        price: 229,
        image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80'
      },
      {
        name: 'Honey Chilli Potato',
        description: 'Crispy potato tossed in sweet chilli glaze.',
        price: 239,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80'
      },
      {
        name: 'Paneer Tikka Angara',
        description: 'Smoky paneer marinated in spicy tandoori masala.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80'
      },
      {
        name: 'Malai Paneer Tikka',
        description: 'Soft paneer in a rich, creamy marinade.',
        price: 319,
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&q=80'
      },
      {
        name: 'Dahi Ke Kebab',
        description: 'Delicate yoghurt kebabs with aromatic spices.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&q=80'
      },
      {
        name: 'Stuffed Mushroom Tikka',
        description: 'Mushrooms filled with a savoury cheese mixture.',
        price: 289,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'
      },
      {
        name: 'Veg Cheese Cigar Rolls',
        description: 'Crispy rolls filled with vegetables and cheese.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&q=80'
      },
      {
        name: 'Tandoori Broccoli',
        description: 'Char-grilled broccoli with creamy Indian spices.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80'
      },
      {
        name: 'Chilli Paneer',
        description: 'Crispy paneer tossed with peppers and Indo-Chinese sauce.',
        price: 289,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Veg Spring Rolls',
        description: 'Golden rolls stuffed with seasoned vegetables.',
        price: 219,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'
      }
    ]
  },

  // 3. Indian Main Course
  {
    category: 'Indian Main Course',
    description: 'Rich, aromatic vegetarian curries cooked with authentic spices and fresh cottage cheese.',
    items: [
      {
        name: 'Paneer Lababdar',
        description: 'Paneer in a rich tomato, butter and spice gravy.',
        price: 329,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80'
      },
      {
        name: 'Paneer Tikka Masala',
        description: 'Tandoori paneer simmered in creamy masala gravy.',
        price: 339,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80'
      },
      {
        name: 'Shahi Paneer',
        description: 'Paneer in a luxurious cashew and cream gravy.',
        price: 329,
        image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80'
      },
      {
        name: 'Kadai Paneer',
        description: 'Paneer cooked with capsicum and freshly ground spices.',
        price: 319,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Palak Paneer',
        description: 'Paneer cubes in smooth spinach gravy.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=600&q=80'
      },
      {
        name: 'Malai Kofta',
        description: 'Soft dumplings in a creamy, mildly sweet gravy.',
        price: 329,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
      },
      {
        name: 'Veg Kofta Curry',
        description: 'Vegetable dumplings in a flavourful curry.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80'
      },
      {
        name: 'Subz Diwani Handi',
        description: 'Seasonal vegetables in a rich traditional gravy.',
        price: 289,
        image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80'
      },
      {
        name: 'Kaju Curry',
        description: 'Cashews simmered in a creamy, aromatic sauce.',
        price: 349,
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80'
      },
      {
        name: 'Chole Masala',
        description: 'Chickpeas cooked with traditional North Indian spices.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&q=80'
      }
    ]
  },

  // 4. Dal & Rice
  {
    category: 'Dal & Rice',
    description: 'Slow-cooked comforting lentils paired with aromatic long-grain basmati biryanis.',
    items: [
      {
        name: 'Dal Makhani',
        description: 'Slow-cooked black lentils finished with butter and cream.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80'
      },
      {
        name: 'Dal Tadka',
        description: 'Yellow lentils tempered with garlic and spices.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1626777553635-be31e7e40889?w=600&q=80'
      },
      {
        name: 'Jeera Rice',
        description: 'Fragrant basmati rice with cumin.',
        price: 169,
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&q=80'
      },
      {
        name: 'Veg Pulao',
        description: 'Basmati rice cooked with vegetables and whole spices.',
        price: 219,
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80'
      },
      {
        name: 'Kashmiri Pulao',
        description: 'Mildly sweet aromatic rice with nuts and fruits.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80'
      },
      {
        name: 'Veg Dum Biryani',
        description: 'Layered basmati rice with vegetables and biryani spices.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80'
      },
      {
        name: 'Hyderabadi Veg Biryani',
        description: 'Spiced vegetable biryani with mint and fried onions.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1633945274413-41c2c31e956f?w=600&q=80'
      },
      {
        name: 'Steamed Rice',
        description: 'Plain, fluffy basmati rice.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80'
      }
    ]
  },

  // 5. Indian Breads
  {
    category: 'Indian Breads',
    description: 'Freshly baked tandoori breads, stuffed kulchas and parathas.',
    items: [
      {
        name: 'Tandoori Roti',
        description: 'Traditional crisp whole wheat bread baked in a clay tandoor oven.',
        price: 35,
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80'
      },
      {
        name: 'Butter Roti',
        description: 'Warm whole wheat tandoor flatbread brushed generously with fresh butter.',
        price: 45,
        image: 'https://images.unsplash.com/photo-1626082929844-66baaa1869e9?w=600&q=80'
      },
      {
        name: 'Plain Naan',
        description: 'Classic soft leavened clay oven flatbread.',
        price: 65,
        image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&q=80'
      },
      {
        name: 'Butter Naan',
        description: 'Fluffy clay oven naan glazed with melted butter.',
        price: 75,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80'
      },
      {
        name: 'Garlic Naan',
        description: 'Aromatic tandoor naan topped with minced roasted garlic and fresh coriander.',
        price: 95,
        image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&q=80'
      },
      {
        name: 'Cheese Garlic Naan',
        description: 'Fluffy naan stuffed with melted mozzarella cheese and minced garlic.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'
      },
      {
        name: 'Laccha Paratha',
        description: 'Flaky, layered whole wheat flatbread roasted with ghee.',
        price: 79,
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80'
      },
      {
        name: 'Aloo Kulcha',
        description: 'Soft tandoori kulcha stuffed with spiced mashed potatoes and herbs.',
        price: 99,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Stuffed Paneer Kulcha',
        description: 'Tandoor baked kulcha stuffed with seasoned cottage cheese.',
        price: 129,
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80'
      },
      {
        name: 'Roomali Roti',
        description: 'Paper-thin, delicate handkerchief flatbread tossed over an inverted wok.',
        price: 49,
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80'
      }
    ]
  },

  // 6. Bella Italia — Pasta & Pizza
  {
    category: 'Bella Italia — Pasta & Pizza',
    description: 'Handcrafted pasta tossed in velvety sauces and artisan stone-baked pizzas.',
    items: [
      {
        name: 'Alfredo Cream Pasta',
        description: 'Creamy Alfredo sauce with garlic, herbs and cheese.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80'
      },
      {
        name: 'Arrabbiata Pasta',
        description: 'Spicy tomato sauce with garlic and fresh herbs.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?w=600&q=80'
      },
      {
        name: 'Pink Sauce Pasta',
        description: 'A delicious blend of creamy white and tangy tomato sauces.',
        price: 319,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80'
      },
      {
        name: 'Pesto Paradise Pasta',
        description: 'Basil pesto, garlic, olive oil and cheese.',
        price: 349,
        image: 'https://images.unsplash.com/photo-1516100882582-76c9a5c509ba?w=600&q=80'
      },
      {
        name: 'Cheesy Baked Pasta',
        description: 'Oven-baked pasta with vegetables and golden melted cheese.',
        price: 369,
        image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&q=80'
      },
      {
        name: 'Wild Mushroom Pasta',
        description: 'Sautéed mushrooms in a velvety cream sauce.',
        price: 349,
        image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&q=80'
      },
      {
        name: 'Margherita Classica',
        description: 'Tomato sauce, mozzarella and fresh basil.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80'
      },
      {
        name: 'Garden Harvest Pizza',
        description: 'Capsicum, onion, mushrooms, olives and mozzarella.',
        price: 329,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'
      },
      {
        name: 'Quattro Formaggi',
        description: 'A luxurious four-cheese pizza.',
        price: 399,
        image: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=600&q=80'
      },
      {
        name: 'Tandoori Paneer Pizza',
        description: 'Smoky paneer, onion, capsicum and mozzarella.',
        price: 359,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'
      },
      {
        name: 'Pesto Garden Pizza',
        description: 'Basil pesto, vegetables, cherry tomatoes and cheese.',
        price: 379,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80'
      },
      {
        name: 'Inferno Veg Pizza',
        description: 'Jalapeños, capsicum, chilli flakes and melted cheese.',
        price: 339,
        image: 'https://images.unsplash.com/photo-1594007654729-407edc4be65b?w=600&q=80'
      }
    ]
  },

  // 7. Chinese & Asian Specialties
  {
    category: 'Chinese & Asian Specialties',
    description: 'Wok-tossed noodles, aromatic fried rice, and tangy Asian appetisers.',
    items: [
      {
        name: 'Veg Hakka Noodles',
        description: 'Stir-fried noodles with crunchy vegetables.',
        price: 219,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80'
      },
      {
        name: 'Schezwan Noodles',
        description: 'Spicy noodles tossed in Schezwan sauce.',
        price: 239,
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&q=80'
      },
      {
        name: 'Chilli Garlic Noodles',
        description: 'Noodles with garlic, chilli and fresh vegetables.',
        price: 229,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80'
      },
      {
        name: 'Burnt Garlic Fried Rice',
        description: 'Fried rice with roasted garlic and vegetables.',
        price: 229,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80'
      },
      {
        name: 'Veg Manchurian Dry',
        description: 'Crispy vegetable dumplings in Indo-Chinese sauce.',
        price: 239,
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&q=80'
      },
      {
        name: 'Veg Manchurian Gravy',
        description: 'Vegetable dumplings in savoury Manchurian gravy.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&q=80'
      },
      {
        name: 'Chilli Paneer Gravy',
        description: 'Paneer and peppers in spicy Chinese-style gravy.',
        price: 289,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Crispy Lotus Stem',
        description: 'Crunchy lotus stem tossed in a sweet and spicy glaze.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'
      }
    ]
  },

  // 8. Sizzlers
  {
    category: 'Sizzlers',
    description: 'Hot sizzling platters with aromatic rice, grilled proteins and rich signature reductions.',
    items: [
      {
        name: 'Paneer Steak Sizzler',
        description: 'Grilled paneer, rice, vegetables and sauce on a hot platter.',
        price: 399,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'
      },
      {
        name: 'Mexican Veg Sizzler',
        description: 'Spiced vegetables, rice, beans and Mexican-style sauce.',
        price: 379,
        image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80'
      },
      {
        name: 'Italian Cottage Cheese Sizzler',
        description: 'Paneer, herbed rice, vegetables and creamy Italian sauce.',
        price: 429,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80'
      },
      {
        name: 'Chinese Veg Sizzler',
        description: 'Noodles, vegetables and crispy starters with Asian sauces.',
        price: 369,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80'
      }
    ]
  },

  // 9. Gujarati & Regional Specials
  {
    category: 'Gujarati & Regional Specials',
    description: 'Heritage recipes, grand festive thalis and iconic Kathiyawadi & Rajasthani delights.',
    items: [
      {
        name: 'Premium Gujarati Thali',
        description: 'Rotli, shaak, dal, kadhi, rice, farsan and sweet.',
        price: 349,
        image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&q=80'
      },
      {
        name: 'Rajasthani Dal Baati Churma',
        description: 'Baked baati with dal, churma and ghee.',
        price: 329,
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&q=80'
      },
      {
        name: 'Gatte Ki Sabzi',
        description: 'Gram-flour dumplings in traditional Rajasthani gravy.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
      },
      {
        name: 'Sev Tameta Nu Shaak',
        description: 'Gujarati tomato curry topped with sev.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80'
      },
      {
        name: 'Undhiyu (Seasonal)',
        description: 'Traditional Gujarati mixed vegetable speciality.',
        price: 279,
        image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80'
      },
      {
        name: 'Bajra Rotla & Ringna Bharthu',
        description: 'Millet flatbread served with smoky eggplant mash.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80'
      },
      {
        name: 'Khichdi Kadhi',
        description: 'Comforting rice-lentil khichdi with Gujarati kadhi.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80'
      },
      {
        name: 'Farsan Platter',
        description: 'A selection of Gujarati savoury snacks.',
        price: 229,
        image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&q=80'
      }
    ]
  },

  // 10. Salads & Sides
  {
    category: 'Salads & Sides',
    description: 'Crisp refreshing salads, chilled whipped raitas, and crunchy roasted papads.',
    items: [
      {
        name: 'Mediterranean Garden Salad',
        description: 'Fresh vegetables, olives and a light herb dressing.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'
      },
      {
        name: 'Tandoori Paneer Salad',
        description: 'Grilled paneer with fresh greens and tangy dressing.',
        price: 229,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'
      },
      {
        name: 'Classic Caesar Salad',
        description: 'Crisp lettuce, creamy dressing and crunchy croutons.',
        price: 219,
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80'
      },
      {
        name: 'Masala Papad',
        description: 'Crispy papad topped with onion, tomato and spices.',
        price: 69,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80'
      },
      {
        name: 'Roasted Papad',
        description: 'Lightly roasted crispy papad.',
        price: 39,
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80'
      },
      {
        name: 'Fresh Garden Raita',
        description: 'Yoghurt with cucumber and fresh vegetables.',
        price: 99,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Boondi Raita',
        description: 'Cooling yoghurt with seasoned boondi.',
        price: 99,
        image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80'
      }
    ]
  },

  // 11. Mocktails & Beverages
  {
    category: 'Mocktails & Beverages',
    description: 'Chilled artisanal mocktails, sparkling coolers, spiced lassis and barista coffees.',
    items: [
      {
        name: 'Blue Lagoon',
        description: 'Citrus cooler with a refreshing blue finish.',
        price: 169,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80'
      },
      {
        name: 'Strawberry Mojito',
        description: 'Strawberry, mint, lime and sparkling soda.',
        price: 179,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80'
      },
      {
        name: 'Virgin Piña Colada',
        description: 'Creamy coconut and pineapple cooler.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80'
      },
      {
        name: 'Kiwi Mojito',
        description: 'Kiwi, mint and lime with soda.',
        price: 179,
        image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=80'
      },
      {
        name: 'Watermelon Mint Cooler',
        description: 'Fresh watermelon flavour with mint.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1587888637140-849b25d80ef9?w=600&q=80'
      },
      {
        name: 'Passion Fruit Cooler',
        description: 'Sweet-tangy tropical fruit refresher.',
        price: 189,
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80'
      },
      {
        name: 'Royal Rose Falooda',
        description: 'Rose milk with vermicelli, basil seeds and ice cream.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80'
      },
      {
        name: 'Kesar Pista Lassi',
        description: 'Creamy yoghurt drink with saffron and pistachio.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80'
      },
      {
        name: 'Cold Coffee with Ice Cream',
        description: 'Chilled coffee topped with ice cream.',
        price: 179,
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80'
      },
      {
        name: 'Masala Chaas',
        description: 'Traditional spiced buttermilk.',
        price: 69,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Fresh Lime Soda',
        description: 'Fresh lime with soda, sweet or salted.',
        price: 99,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80'
      },
      {
        name: 'Mineral Water',
        description: 'Packaged drinking water.',
        price: 40,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&q=80'
      }
    ]
  },

  // 12. Desserts
  {
    category: 'Desserts',
    description: 'Decadent warm cakes, sizzling brownies, artisanal kulfis, and traditional Indian sweets.',
    items: [
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with a molten centre.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80'
      },
      {
        name: 'Sizzling Brownie',
        description: 'Chocolate brownie served on a hot plate with ice cream.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80'
      },
      {
        name: 'Brownie with Ice Cream',
        description: 'Rich brownie paired with vanilla ice cream.',
        price: 199,
        image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80'
      },
      {
        name: 'Baked Cheesecake',
        description: 'Creamy cheesecake with a delicate biscuit base.',
        price: 249,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80'
      },
      {
        name: 'Tiramisu',
        description: 'Coffee-flavoured layered Italian dessert.',
        price: 269,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80'
      },
      {
        name: 'Gulab Jamun with Rabri',
        description: 'Warm gulab jamun served with thickened sweet milk.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80'
      },
      {
        name: 'Matka Kulfi',
        description: 'Traditional creamy kulfi served in a clay pot.',
        price: 129,
        image: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&q=80'
      },
      {
        name: 'Shahi Tukda',
        description: 'Fried bread dessert topped with rich rabri.',
        price: 169,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80'
      },
      {
        name: 'Rasmalai',
        description: 'Soft cottage-cheese dumplings in saffron milk.',
        price: 149,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80'
      },
      {
        name: 'Kesar Pista Kulfi',
        description: 'Saffron and pistachio flavoured Indian frozen dessert.',
        price: 129,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80'
      }
    ]
  },

  // 13. Signature Combos
  {
    category: 'Signature Combos',
    description: 'Specially curated culinary pairings offering complete dynamic dining value.',
    items: [
      {
        name: 'Italian Duo',
        description: 'Any classic pasta + fresh lime soda',
        price: 349,
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80'
      },
      {
        name: 'Pizza Party',
        description: 'Margherita pizza + cold drink',
        price: 299,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80'
      },
      {
        name: 'Paneer Feast',
        description: 'Paneer curry + 2 butter rotis + jeera rice',
        price: 449,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80'
      },
      {
        name: 'Chinese Treat',
        description: 'Hakka noodles + veg Manchurian dry',
        price: 399,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80'
      },
      {
        name: 'Royal Dinner',
        description: 'Paneer Lababdar + dal tadka + 2 naan + jeera rice',
        price: 599,
        image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&q=80'
      },
      {
        name: 'Sweet Ending',
        description: 'Brownie with ice cream + cold coffee',
        price: 329,
        image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80'
      }
    ]
  }
];

module.exports = menuData;
