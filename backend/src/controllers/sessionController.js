const DiningSession = require('../models/DiningSession');
const Table = require('../models/Table');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Start Dining Session for Table (Walk-in or QR creation)
// @route   POST /api/sessions/start
// @access  Public (from QR verification) / Private (Waiter/Admin)
const startSession = async (req, res, next) => {
  try {
    const { tableNumber, customerName, customerPhone, qrKey } = req.body;

    const table = await Table.findOne({ tableNumber });
    if (!table) {
      res.status(404);
      throw new Error(`Table ${tableNumber} not found`);
    }

    // Security gate: Must provide EITHER a valid QR key OR a valid staff JWT token
    let isStaffAuthenticated = false;

    // Check for JWT staff auth (admin/waiter creating session for walk-in)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_dynamicdinekey_129031');
        const user = await User.findById(decoded.id).select('-password');
        if (user && ['admin', 'waiter'].includes(user.role)) {
          isStaffAuthenticated = true;
        }
      } catch (jwtErr) {
        // JWT invalid — fall through to QR key check
      }
    }

    // If QR key is passed, verify it (Public Customer path security check)
    if (qrKey) {
      if (table.qrCodeData !== qrKey) {
        return res.status(403).json({
          success: false,
          message: 'Invalid table QR key. Scanning required to start session.',
        });
      }
    } else if (!isStaffAuthenticated) {
      // No QR key AND no staff auth — reject
      return res.status(403).json({
        success: false,
        message: 'Access denied. Provide a valid QR key or authenticate as staff.',
      });
    }

    // Check if table is already occupied
    if (table.status === 'occupied' && table.currentSessionId) {
      // Re-use session if it belongs to them or just return active session info
      const activeSession = await DiningSession.findById(table.currentSessionId);
      if (activeSession) {
        return res.json({
          success: true,
          message: 'Active session already exists for this table',
          session: activeSession,
        });
      }
    }

    // Generate secure unique token for this customer dining session
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const session = await DiningSession.create({
      sessionToken,
      table: table._id,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      orders: [],
      runningTotal: 0.00,
      paymentStatus: 'pending',
    });

    table.status = 'occupied';
    table.currentSessionId = session._id;
    await table.save();

    // Broadcast table status change
    if (req.io) {
      req.io.emit('table_status_updated', {
        tableNumber: table.tableNumber,
        status: 'occupied',
      });
    }

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Active Session for a Table
// @route   GET /api/sessions/active/:tableNumber
// @access  Public (with token) / Private (Staff)
const getActiveSession = async (req, res, next) => {
  try {
    const { tableNumber } = req.params;
    const { token } = req.query; // Secure token checking

    const table = await Table.findOne({ tableNumber });
    if (!table) {
      res.status(404);
      throw new Error(`Table ${tableNumber} not found`);
    }

    if (!table.currentSessionId) {
      return res.json({ success: true, active: false, session: null });
    }

    const session = await DiningSession.findById(table.currentSessionId)
      .populate({
        path: 'orders',
        populate: {
          path: 'items.product',
          model: 'Product',
        },
      })
      .populate('table');

    if (!session) {
      return res.json({ success: true, active: false, session: null });
    }

    // Security validation for customer orders
    if (token && session.sessionToken !== token) {
      return res.status(403).json({
        success: false,
        message: 'Invalid session token. Access denied to this table.',
      });
    }

    res.json({ success: true, active: true, session });
  } catch (error) {
    next(error);
  }
};

// @desc    Request bill payment check (Customer portal action)
// @route   POST /api/sessions/:id/request-bill
// @access  Public (via session token)
const requestBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const session = await DiningSession.findById(id).populate('table');
    if (!session) {
      res.status(404);
      throw new Error('Dining session not found');
    }

    if (session.sessionToken !== token) {
      return res.status(403).json({ success: false, message: 'Invalid session token' });
    }

    // Set billing request state in database
    session.billRequested = true;
    await session.save();

    // Broadcast notification to waiters and admin
    if (req.io) {
      req.io.emit('bill_requested', {
        tableNumber: session.table.tableNumber,
        sessionId: session._id,
        customerName: session.customerName,
      });
    }

    res.json({ success: true, message: 'Bill settlement requested. A waiter is on their way.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  getActiveSession,
  requestBill,
};
