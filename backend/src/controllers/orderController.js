const Order = require('../models/Order');
const DiningSession = require('../models/DiningSession');
const Product = require('../models/Product');
const PricingConfig = require('../models/PricingConfig');
const PricingHistory = require('../models/PricingHistory');

// @desc    Place a new order for a table
// @route   POST /api/orders
// @access  Public (via session token validation)
const createOrder = async (req, res, next) => {
  try {
    const { sessionId, sessionToken, items, specialInstructions } = req.body;

    if (!sessionId || !sessionToken || !items || items.length === 0) {
      res.status(400);
      throw new Error('Missing session identification or order items');
    }

    const session = await DiningSession.findById(sessionId).populate('table');
    if (!session) {
      res.status(404);
      throw new Error('Dining session not found');
    }

    // Security check: Match session token
    if (session.sessionToken !== sessionToken) {
      return res.status(403).json({ success: false, message: 'Invalid session token. Access denied.' });
    }

    if (session.paymentStatus === 'paid') {
      res.status(400);
      throw new Error('Cannot add orders to a closed dining session');
    }

    const processedItems = [];
    let orderSubtotal = 0.00;

    // Verify stock and fetch prices for each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found`);
      }

      if (!product.isAvailable) {
        res.status(400);
        throw new Error(`Product '${product.name}' is currently unavailable`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for '${product.name}'. Available: ${product.stock}`);
      }

      // Lock current live price at order time
      const priceAtOrder = product.currentPrice;
      const itemTotal = priceAtOrder * item.quantity;
      orderSubtotal += itemTotal;

      processedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        priceAtOrder: priceAtOrder,
        status: 'pending',
      });

      // Deduct stock
      product.stock -= item.quantity;
      
      // Increment demandScore by order quantity
      product.demandScore += item.quantity;
      await product.save();

      // Log/Trigger instant pricing review for ordered items
      // (This makes prices react instantly to orders for a better user experience!)
      await evaluateProductPricingOnOrder(product, item.quantity, req.io);
    }

    // Create the order document
    const order = await Order.create({
      session: session._id,
      tableNumber: session.table.tableNumber,
      items: processedItems,
      overallStatus: 'pending',
      specialInstructions: specialInstructions || '',
    });

    // Update dining session running total and orders array
    session.orders.push(order._id);
    session.runningTotal += orderSubtotal;
    await session.save();

    // Populate order product details for socket emit
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product')
      .populate('session');

    // Broadcast new order to Kitchen and Waiter dashboards
    if (req.io) {
      req.io.emit('order_placed', {
        order: populatedOrder,
        tableNumber: session.table.tableNumber,
      });
      req.io.emit('table_status_updated', {
        tableNumber: session.table.tableNumber,
        status: 'occupied',
      });
    }

    res.status(201).json({
      success: true,
      order: populatedOrder,
      sessionRunningTotal: session.runningTotal,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Real-time price increase on order placement
const evaluateProductPricingOnOrder = async (product, quantity, io) => {
  if (!product.dynamicPricingEnabled) return;

  const config = await PricingConfig.findOne({});
  if (!config || !config.globalEnabled) return;

  // If item is ordered, price climbs!
  // Price increases by (priceIncreasePercent * quantity)% plus fixedIncreaseAmount
  const increaseFactor = (config.priceIncreasePercent / 100) * quantity;
  const previousPrice = product.currentPrice;
  
  let newPrice = product.currentPrice * (1 + increaseFactor) + (config.fixedIncreaseAmount * quantity);
  
  // Enforce Max Price limit
  if (newPrice > product.maxPrice) {
    newPrice = product.maxPrice;
  }
  // Enforce global Max Cap relative to base price if set (e.g. maxPriceChangePerUpdatePercent clamp)
  const maxAllowedJump = product.currentPrice * (1 + (config.maxPriceChangePerUpdatePercent / 100));
  if (newPrice > maxAllowedJump) {
    newPrice = maxAllowedJump;
  }

  // Double decimals formatting
  newPrice = parseFloat(newPrice.toFixed(2));

  if (newPrice !== previousPrice) {
    product.currentPrice = newPrice;
    await product.save();

    const percentageChanged = ((newPrice - previousPrice) / previousPrice) * 100;

    await PricingHistory.create({
      product: product._id,
      previousPrice,
      newPrice,
      basePrice: product.basePrice,
      demandScore: product.demandScore,
      triggerThreshold: `Order Quantity: ${quantity}`,
      percentageChanged: parseFloat(percentageChanged.toFixed(2)),
      reason: 'high_demand',
    });

    if (io) {
      io.emit('price_updated', {
        productId: product._id,
        currentPrice: newPrice,
        previousPrice,
        percentageChanged: parseFloat(percentageChanged.toFixed(2)),
      });
    }
  }
};

// @desc    Get active orders (Pending, Accepted, Preparing, Ready, Served)
// @route   GET /api/orders/active
// @access  Private (Waiter/Kitchen/Admin)
const getActiveOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      overallStatus: { $in: ['pending', 'accepted', 'preparing', 'ready', 'served'] },
    })
      .populate('items.product')
      .populate('session')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order items status
// @route   PUT /api/orders/:id/status
// @access  Private (Waiter/Kitchen/Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, itemId } = req.body; // If itemId is provided, update that item; else update whole order status

    const order = await Order.findById(id).populate('session').populate('items.product');
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (itemId) {
      // Find item
      const item = order.items.id(itemId);
      if (!item) {
        res.status(404);
        throw new Error('Order item not found');
      }
      item.status = status;
    } else {
      // Update overall order status and all item statuses
      order.overallStatus = status;
      order.items.forEach((item) => {
        if (item.status !== 'cancelled' && item.status !== 'served') {
          item.status = status;
        }
      });
    }

    // Recalculate overall status based on items if individual item was changed
    if (itemId) {
      const statuses = order.items.map((i) => i.status);
      if (statuses.every((s) => s === 'served' || s === 'cancelled')) {
        order.overallStatus = 'completed';
      } else if (statuses.some((s) => s === 'ready')) {
        order.overallStatus = 'ready';
      } else if (statuses.some((s) => s === 'preparing')) {
        order.overallStatus = 'preparing';
      } else if (statuses.some((s) => s === 'accepted')) {
        order.overallStatus = 'accepted';
      }
    }

    await order.save();

    // Broadcast status change via Socket.IO
    if (req.io) {
      req.io.emit('order_status_updated', {
        orderId: order._id,
        tableNumber: order.tableNumber,
        overallStatus: order.overallStatus,
        itemId: itemId || null,
        itemStatus: itemId ? order.items.id(itemId).status : null,
      });

      // Send notifications for served/ready states
      if (status === 'ready') {
        req.io.emit('notification', {
          type: 'order_ready',
          message: `Table ${order.tableNumber}'s food is ready to serve!`,
          tableNumber: order.tableNumber,
        });
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getActiveOrders,
  updateOrderStatus,
};
