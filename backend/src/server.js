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

// Temporary cleanup: Clear Table 7 active Mojito orders and set status to cleaning
const mongoose = require('mongoose');
setTimeout(async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const ordersCollection = db.collection('orders');
    const tablesCollection = db.collection('tables');
    
    // 1. Wipe active orders
    const orders = await ordersCollection.find({ tableNumber: 7, overallStatus: { $ne: 'completed' } }).toArray();
    for (const order of orders) {
      const filteredItems = order.items.filter(item => !item.name.toLowerCase().includes('mojito'));
      const newStatus = filteredItems.length === 0 ? 'cancelled' : order.overallStatus;
      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: { items: filteredItems, overallStatus: newStatus } }
      );
    }
    
    // 2. Set Table 7 to cleaning and disconnect active session
    await tablesCollection.updateOne(
      { tableNumber: 7 },
      { $set: { status: 'cleaning', currentSessionId: null } }
    );
    
    console.log('Successfully cleared Mojito items and updated Table 7 state to cleaning.');
  } catch (err) {
    console.error('Failed to clear Table 7 orders/update table state:', err);
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
