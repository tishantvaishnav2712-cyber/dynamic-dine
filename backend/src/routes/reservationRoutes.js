const express = require('express');
const router = express.Router();
const { getReservations, createReservation, updateReservationStatus } = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'waiter'), getReservations);
router.post('/', createReservation); // Publicly bookable by customer
router.put('/:id/status', protect, authorize('admin', 'waiter'), updateReservationStatus);

module.exports = router;
