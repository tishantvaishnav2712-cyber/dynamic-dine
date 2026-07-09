const express = require('express');
const router = express.Router();
const { startSession, getActiveSession, requestBill } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/start', startSession);
router.get('/active/:tableNumber', getActiveSession);
router.post('/:id/request-bill', requestBill);

module.exports = router;
