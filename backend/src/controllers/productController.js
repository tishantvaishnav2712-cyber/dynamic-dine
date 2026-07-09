const Product = require('../models/Product');
const PricingHistory = require('../models/PricingHistory');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page, limit } = req.query;

    const query = {};

    // Apply filters
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.currentPrice = {};
      if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100; // default return all or large set since menus are moderately sized
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions = { name: 1 };
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .populate('category')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      image,
      basePrice,
      minPrice,
      maxPrice,
      stock,
      isAvailable,
      dynamicPricingEnabled,
    } = req.body;

    if (!name || !category || basePrice === undefined) {
      res.status(400);
      throw new Error('Please fill in all required fields (name, category, basePrice)');
    }

    const decBase = parseFloat(basePrice);
    const decMin = minPrice !== undefined ? parseFloat(minPrice) : decBase * 0.8;
    const decMax = maxPrice !== undefined ? parseFloat(maxPrice) : decBase * 2.5;

    const product = await Product.create({
      name,
      category,
      description: description || '',
      image: image || '',
      basePrice: decBase,
      currentPrice: decBase, // Starts at base price
      minPrice: decMin,
      maxPrice: decMax,
      stock: parseInt(stock, 10) || 0,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      dynamicPricingEnabled: dynamicPricingEnabled !== undefined ? dynamicPricingEnabled : true,
      demandScore: 0,
    });

    // Record initial pricing log
    await PricingHistory.create({
      product: product._id,
      previousPrice: decBase,
      newPrice: decBase,
      basePrice: decBase,
      demandScore: 0,
      triggerThreshold: 'Initial creation',
      percentageChanged: 0,
      reason: 'manual_reset',
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      image,
      basePrice,
      currentPrice,
      minPrice,
      maxPrice,
      stock,
      isAvailable,
      dynamicPricingEnabled,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const previousPrice = product.currentPrice;

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (image !== undefined) product.image = image;
    if (stock !== undefined) product.stock = parseInt(stock, 10);
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    if (dynamicPricingEnabled !== undefined) product.dynamicPricingEnabled = dynamicPricingEnabled;

    let priceChanged = false;
    let changeReason = 'manual_override';

    // If limits or base prices change
    if (basePrice !== undefined) {
      product.basePrice = parseFloat(basePrice);
      // Reset current price to base price on manual basePrice change
      product.currentPrice = parseFloat(basePrice);
      priceChanged = true;
      changeReason = 'manual_reset';
    }
    if (currentPrice !== undefined && basePrice === undefined) {
      // Manual current price override
      product.currentPrice = parseFloat(currentPrice);
      priceChanged = true;
    }
    if (minPrice !== undefined) product.minPrice = parseFloat(minPrice);
    if (maxPrice !== undefined) product.maxPrice = parseFloat(maxPrice);

    await product.save();

    if (priceChanged) {
      const percentageChanged = previousPrice > 0 
        ? ((product.currentPrice - previousPrice) / previousPrice) * 100 
        : 0;

      await PricingHistory.create({
        product: product._id,
        previousPrice,
        newPrice: product.currentPrice,
        basePrice: product.basePrice,
        demandScore: product.demandScore,
        triggerThreshold: 'Manual override',
        percentageChanged: parseFloat(percentageChanged.toFixed(2)),
        reason: changeReason,
      });

      // Broadcast real-time price change via socket
      if (req.io) {
        req.io.emit('price_updated', {
          productId: product._id,
          currentPrice: product.currentPrice,
          previousPrice,
          percentageChanged,
        });
      }
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset product price to base price
// @route   POST /api/products/:id/reset
// @access  Private (Admin)
const resetProductPrice = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const previousPrice = product.currentPrice;
    product.currentPrice = product.basePrice;
    product.demandScore = 0; // Clear demand score on manual reset
    await product.save();

    const percentageChanged = previousPrice > 0
      ? ((product.basePrice - previousPrice) / previousPrice) * 100
      : 0;

    await PricingHistory.create({
      product: product._id,
      previousPrice,
      newPrice: product.basePrice,
      basePrice: product.basePrice,
      demandScore: 0,
      triggerThreshold: 'Manual reset',
      percentageChanged: parseFloat(percentageChanged.toFixed(2)),
      reason: 'manual_reset',
    });

    if (req.io) {
      req.io.emit('price_updated', {
        productId: product._id,
        currentPrice: product.currentPrice,
        previousPrice,
        percentageChanged,
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  resetProductPrice,
  deleteProduct,
};
