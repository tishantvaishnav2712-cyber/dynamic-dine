const Table = require('../models/Table');
const DiningSession = require('../models/DiningSession');
const QRCode = require('qrcode');
const crypto = require('crypto');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private (Admin/Waiter/Kitchen)
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({}).populate('currentSessionId');
    res.json({ success: true, tables });
  } catch (error) {
    next(error);
  }
};

// @desc    Update table status manually
// @route   PUT /api/tables/:tableNumber/status
// @access  Private (Admin/Waiter)
const updateTableStatus = async (req, res, next) => {
  try {
    const { tableNumber } = req.params;
    const { status, capacity } = req.body;

    const table = await Table.findOne({ tableNumber });

    if (!table) {
      res.status(404);
      throw new Error(`Table ${tableNumber} not found`);
    }

    if (status) table.status = status;
    if (capacity) table.capacity = capacity;

    // If setting to available or cleaning, detach session if complete
    if (status === 'available' || status === 'cleaning') {
      table.currentSessionId = null;
    }

    await table.save();

    // Notify all staff of table status update
    if (req.io) {
      req.io.emit('table_status_updated', {
        tableNumber: table.tableNumber,
        status: table.status,
      });
    }

    res.json({ success: true, table });
  } catch (error) {
    next(error);
  }
};

const os = require('os');

// Helper to get local network IP address of the server
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// @desc    Generate/Regenerate Secure QR Code for a Table
// @route   POST /api/tables/:tableNumber/qr
// @access  Private (Admin)
const generateTableQRCode = async (req, res, next) => {
  try {
    const { tableNumber } = req.params;
    const table = await Table.findOne({ tableNumber });

    if (!table) {
      res.status(404);
      throw new Error(`Table ${tableNumber} not found`);
    }

    // Generate a secure random token key for this table
    const tableSecretKey = crypto.randomBytes(16).toString('hex');
    table.qrCodeData = tableSecretKey;
    await table.save();

    // Construct the QR Code target client URL automatically using frontend domain or local IP address
    const baseFrontendUrl = process.env.FRONTEND_URL || `http://${getLocalIpAddress()}:5173`;
    const qrUrl = `${baseFrontendUrl}/table/${tableNumber}?key=${tableSecretKey}`;

    // Generate base64 QR Image Data URI
    const qrImageBase64 = await QRCode.toDataURL(qrUrl, {
      color: {
        dark: '#00E5FF',  // Cyan color code representing Dynamic Dine theme
        light: '#0B0F19', // Dark background
      },
      width: 300,
    });

    res.json({
      success: true,
      tableNumber: table.tableNumber,
      qrUrl,
      qrImage: qrImageBase64,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify QR Table access
// @route   POST /api/tables/:tableNumber/verify
// @access  Public (Customer scanning QR)
const verifyTableAccess = async (req, res, next) => {
  try {
    const { tableNumber } = req.params;
    const { key } = req.body;

    const table = await Table.findOne({ tableNumber }).populate('currentSessionId');

    if (!table) {
      return res.status(404).json({ success: false, message: `Table ${tableNumber} not found` });
    }

    // Initialize key if not yet set (first run safeguard)
    if (!table.qrCodeData) {
      table.qrCodeData = crypto.randomBytes(16).toString('hex');
      await table.save();
    }

    // Verify key
    if (table.qrCodeData !== key) {
      return res.status(403).json({
        success: false,
        message: 'Invalid secure QR code for this table. Access denied.',
      });
    }

    res.json({
      success: true,
      message: 'Access verified',
      table: {
        tableNumber: table.tableNumber,
        status: table.status,
        capacity: table.capacity,
        activeSession: table.currentSessionId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables,
  updateTableStatus,
  generateTableQRCode,
  verifyTableAccess,
};
