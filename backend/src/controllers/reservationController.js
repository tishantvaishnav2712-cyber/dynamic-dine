const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const DiningSession = require('../models/DiningSession');
const crypto = require('crypto');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (Admin/Waiter)
const getReservations = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const query = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.dateTime = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('table')
      .sort({ dateTime: 1 });

    res.json({ success: true, reservations });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Public (Customer) / Private (Admin/Waiter)
const createReservation = async (req, res, next) => {
  try {
    const { customerName, customerPhone, tableId, dateTime, guestCount } = req.body;

    if (!customerName || !customerPhone || !tableId || !dateTime || !guestCount) {
      res.status(400);
      throw new Error('Please fill in all reservation fields');
    }

    const bookingTime = new Date(dateTime);
    
    // Check if table exists
    const table = await Table.findById(tableId);
    if (!table) {
      res.status(404);
      throw new Error('Selected table does not exist');
    }

    // Basic overlap validation (e.g. check 2-hour window around the requested reservation)
    const windowStart = new Date(bookingTime.getTime() - 2 * 60 * 60 * 1000);
    const windowEnd = new Date(bookingTime.getTime() + 2 * 60 * 60 * 1000);

    const overlapping = await Reservation.findOne({
      table: tableId,
      status: { $in: ['pending', 'confirmed', 'seated'] },
      dateTime: { $gte: windowStart, $lte: windowEnd },
    });

    if (overlapping) {
      res.status(400);
      throw new Error('Table is already reserved or occupied around this time slot');
    }

    const reservation = await Reservation.create({
      customerName,
      customerPhone,
      table: tableId,
      dateTime: bookingTime,
      guestCount: parseInt(guestCount, 10),
      status: 'confirmed', // Auto-confirm for simplicity
    });

    // Update Table status to Reserved if it's for today
    const today = new Date();
    if (
      bookingTime.getDate() === today.getDate() &&
      bookingTime.getMonth() === today.getMonth() &&
      bookingTime.getFullYear() === today.getFullYear()
    ) {
      // Check if table is currently available before marking reserved
      if (table.status === 'available') {
        table.status = 'reserved';
        await table.save();

        if (req.io) {
          req.io.emit('table_status_updated', {
            tableNumber: table.tableNumber,
            status: 'reserved',
          });
        }
      }
    }

    if (req.io) {
      req.io.emit('reservation_updated', { reservation });
    }

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status (e.g. seated, cancelled)
// @route   PUT /api/reservations/:id/status
// @access  Private (Admin/Waiter)
const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findById(id).populate('table');

    if (!reservation) {
      res.status(404);
      throw new Error('Reservation not found');
    }

    reservation.status = status;
    await reservation.save();

    const table = await Table.findById(reservation.table._id);

    // If seated, create active dining session
    if (status === 'seated') {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const session = await DiningSession.create({
        sessionToken,
        table: table._id,
        reservation: reservation._id,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        orders: [],
        runningTotal: 0.00,
        paymentStatus: 'pending',
      });

      table.status = 'occupied';
      table.currentSessionId = session._id;
      await table.save();

      if (req.io) {
        req.io.emit('table_status_updated', {
          tableNumber: table.tableNumber,
          status: 'occupied',
        });
      }
    } else if (status === 'cancelled') {
      // Revert table status to available if it was reserved
      if (table.status === 'reserved') {
        table.status = 'available';
        await table.save();

        if (req.io) {
          req.io.emit('table_status_updated', {
            tableNumber: table.tableNumber,
            status: 'available',
          });
        }
      }
    }

    if (req.io) {
      req.io.emit('reservation_updated', { reservation });
    }

    res.json({ success: true, reservation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReservations,
  createReservation,
  updateReservationStatus,
};
