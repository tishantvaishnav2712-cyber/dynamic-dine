const express = require('express');
const router = express.Router();
const { getTables, updateTableStatus, generateTableQRCode, verifyTableAccess } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'waiter', 'kitchen', 'customer'), getTables);
router.put('/:tableNumber/status', protect, authorize('admin', 'waiter'), updateTableStatus);
router.post('/:tableNumber/qr', protect, authorize('admin'), generateTableQRCode);
router.post('/:tableNumber/verify', verifyTableAccess);

module.exports = router;
