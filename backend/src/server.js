const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load configurations
dotenv.config();

const connectDB = require('./config/db');
const seedDatabase = require('./config/seed');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { initPricingScheduler } = require('./services/pricingScheduler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const billingRoutes = require('./routes/billingRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Initialize database
connectDB();
seedDatabase();

// Temporary cleanup: Reset Table 7 and clear its sessions
const mongoose = require('mongoose');
setTimeout(async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const tablesCollection = db.collection('tables');
    const sessionsCollection = db.collection('diningsessions');
    const ordersCollection = db.collection('orders');
    
    // 1. Delete all active sessions and orders linked to Table 7
    await sessionsCollection.deleteMany({ tableNumber: 7 });
    await ordersCollection.deleteMany({ tableNumber: 7 });
    
    // 2. Delete and recreate Table 7 fresh
    await tablesCollection.deleteMany({ tableNumber: 7 });
    await tablesCollection.insertOne({
      tableNumber: 7,
      capacity: 6,
      status: 'available',
      currentSessionId: null,
      qrCodeData: 'TABLE_7_TOKEN_UNASSIGNED',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Successfully deleted and recreated Table 7 and cleared all its sessions.');
  } catch (err) {
    console.error('Failed to reset Table 7:', err);
  }
}, 7000);

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = socketio(server, {
  cors: {
    origin: '*', // Allow connections from frontend clients
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach Socket.IO to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// API Routers
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on('join_table', (tableNumber) => {
    socket.join(`table_${tableNumber}`);
    console.log(`Socket ${socket.id} joined room table_${tableNumber}`);
  });

  socket.on('call_waiter_client', (data) => {
    // Broadcast waiter request to all waiters/admin
    io.emit('waiter_called', {
      tableNumber: data.tableNumber,
      message: `Table ${data.tableNumber} is requesting assistance!`,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Pricing Engine background scheduler activation
initPricingScheduler(io);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
