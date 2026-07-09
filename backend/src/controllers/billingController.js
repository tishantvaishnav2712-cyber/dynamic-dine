const DiningSession = require('../models/DiningSession');
const Table = require('../models/Table');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

// @desc    Generate Invoice & Settle Payment (Checkout Dining Session)
// @route   POST /api/billing/settle
// @access  Private (Waiter/Admin)
const settlePayment = async (req, res, next) => {
  try {
    const { sessionId, paymentMethod, serviceChargeRate } = req.body;

    if (!sessionId || !paymentMethod) {
      res.status(400);
      throw new Error('Please provide session ID and payment method');
    }

    const session = await DiningSession.findById(sessionId)
      .populate('table')
      .populate({
        path: 'orders',
        populate: {
          path: 'items.product',
          model: 'Product',
        },
      });

    if (!session) {
      res.status(404);
      throw new Error('Dining session not found');
    }

    if (session.paymentStatus === 'paid') {
      res.status(400);
      throw new Error('This dining session has already been settled and paid');
    }

    // 1. Gather all items from all non-cancelled orders of this session
    const invoiceItems = [];
    let subtotal = 0.00;

    session.orders.forEach((order) => {
      if (order.overallStatus === 'cancelled') return;

      order.items.forEach((item) => {
        if (item.status === 'cancelled') return;

        const qty = item.quantity;
        const unitPrice = item.priceAtOrder;
        const itemTotal = parseFloat((qty * unitPrice).toFixed(2));
        
        subtotal += itemTotal;

        // Check if item already exists in consolidated invoice items
        const existing = invoiceItems.find((i) => i.product.toString() === item.product._id.toString());
        if (existing) {
          existing.quantity += qty;
          existing.totalPrice = parseFloat((existing.quantity * existing.priceAtOrder).toFixed(2));
        } else {
          invoiceItems.push({
            name: item.name,
            product: item.product._id,
            quantity: qty,
            priceAtOrder: unitPrice,
            totalPrice: itemTotal,
          });
        }
      });
    });

    // 2. Exact decimal calculations for GST (5%) and Service Charge
    const gstRate = 0.05; // 5% GST
    const scRate = parseFloat(serviceChargeRate) || 0.00; // e.g. 10% (0.10) if passed by waiter

    const gstAmount = parseFloat((subtotal * gstRate).toFixed(2));
    const serviceChargeAmount = parseFloat((subtotal * scRate).toFixed(2));
    const grandTotal = parseFloat((subtotal + gstAmount + serviceChargeAmount).toFixed(2));

    // 3. Generate a unique Invoice Number
    // Format: DD-YYYYMMDD-XXXX (Dynamic Dine - Date - Random/Session suffix)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `DD-${dateStr}-${randSuffix}`;

    // 4. Create the Invoice document
    const invoice = await Invoice.create({
      invoiceNumber,
      session: session._id,
      tableNumber: session.table.tableNumber,
      customerName: session.customerName,
      items: invoiceItems,
      subtotal,
      gst: gstAmount,
      serviceCharge: serviceChargeAmount,
      grandTotal,
      paymentMethod,
      status: 'paid',
    });

    // 5. Update DiningSession status to Completed
    session.paymentStatus = 'paid';
    session.endTime = Date.now();
    session.runningTotal = grandTotal;
    await session.save();

    // 6. Complete all active orders in this session
    await Order.updateMany(
      { session: session._id, overallStatus: { $ne: 'cancelled' } },
      { overallStatus: 'completed' }
    );

    // 7. Update Table status to Cleaning (then manual release to Available)
    const table = await Table.findById(session.table._id);
    table.status = 'cleaning';
    table.currentSessionId = null;
    await table.save();

    // 8. Broadcast billing completions and table status updates via Socket.IO
    if (req.io) {
      req.io.emit('payment_completed', {
        sessionId: session._id,
        tableNumber: table.tableNumber,
        grandTotal,
      });
      req.io.emit('table_status_updated', {
        tableNumber: table.tableNumber,
        status: 'cleaning',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment settled and invoice generated successfully',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices (Filters: table, date, paymentMethod)
// @route   GET /api/billing/invoices
// @access  Private (Admin/Waiter)
const getInvoices = async (req, res, next) => {
  try {
    const { tableNumber, date, paymentMethod } = req.query;
    const query = {};

    if (tableNumber) query.tableNumber = parseInt(tableNumber, 10);
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  settlePayment,
  getInvoices,
};
