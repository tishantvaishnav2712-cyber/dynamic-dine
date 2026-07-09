const express = require('express');
const router = express.Router();
const { createOrder, getActiveOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', createOrder); // Public placing via session token
router.get('/active', protect, authorize('admin', 'waiter', 'kitchen'), getActiveOrders);
router.put('/:id/status', protect, authorize('admin', 'waiter', 'kitchen'), updateOrderStatus);

module.exports = router;
