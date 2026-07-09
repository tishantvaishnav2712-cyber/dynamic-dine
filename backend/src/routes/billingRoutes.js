const express = require('express');
const router = express.Router();
const { settlePayment, getInvoices } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/settle', protect, authorize('admin', 'waiter'), settlePayment);
router.get('/invoices', protect, authorize('admin', 'waiter'), getInvoices);

module.exports = router;
