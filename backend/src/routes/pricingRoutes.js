const express = require('express');
const router = express.Router();
const { getPricingConfig, updatePricingConfig, getPricingHistory, resetAllPrices } = require('../controllers/pricingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/config', protect, authorize('admin'), getPricingConfig);
router.put('/config', protect, authorize('admin'), updatePricingConfig);
router.get('/history', protect, authorize('admin'), getPricingHistory);
router.post('/reset', protect, authorize('admin'), resetAllPrices);

module.exports = router;
