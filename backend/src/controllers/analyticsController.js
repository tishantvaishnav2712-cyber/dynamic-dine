const Invoice = require('../models/Invoice');
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const Table = require('../models/Table');
const DiningSession = require('../models/DiningSession');

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    
    // Start of Today
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of Week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of Month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Start of Year
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // 1. Revenue calculations (Today, Week, Month, Year)
    const revenueStats = await Invoice.aggregate([
      {
        $facet: {
          todayRevenue: [
            { $match: { createdAt: { $gte: startOfToday }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ],
          weekRevenue: [
            { $match: { createdAt: { $gte: startOfWeek }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ],
          monthRevenue: [
            { $match: { createdAt: { $gte: startOfMonth }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ],
          yearRevenue: [
            { $match: { createdAt: { $gte: startOfYear }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ]
        }
      }
    ]);

    const todayRev = revenueStats[0].todayRevenue[0]?.total || 0.00;
    const weekRev = revenueStats[0].weekRevenue[0]?.total || 0.00;
    const monthRev = revenueStats[0].monthRevenue[0]?.total || 0.00;
    const yearRev = revenueStats[0].yearRevenue[0]?.total || 0.00;

    // 2. Average Order Value
    const avgOrderStats = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, average: { $avg: '$subtotal' } } }
    ]);
    const avgOrderValue = avgOrderStats[0]?.average || 0.00;

    // 3. Customer Count (Today)
    const customerCount = await DiningSession.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // 4. Reservation Statistics
    const totalReservations = await Reservation.countDocuments();
    const confirmedReservations = await Reservation.countDocuments({ status: 'confirmed' });
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });

    // 5. Table Occupancy Rate
    const totalTables = 10; // fixed
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    const tableOccupancyRate = (occupiedTables / totalTables) * 100;

    // 6. Most & Least Ordered Products (Consolidated from Invoices)
    const productPopularity = await Invoice.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { quantity: -1 } }
    ]);

    const mostOrdered = productPopularity.slice(0, 5);
    const leastOrdered = [...productPopularity].reverse().slice(0, 5);

    // 7. Peak Hour Analysis (Order frequency grouped by hour of day)
    const peakHours = await Invoice.aggregate([
      {
        $project: {
          hour: { $hour: { date: '$createdAt', timezone: '+05:30' } }, // Adjust UTC offset if needed
          grandTotal: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          orderCount: { $sum: 1 },
          revenue: { $sum: '$grandTotal' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format peak hours data for Recharts (fill missing hours with 0)
    const formattedPeakHours = Array.from({ length: 24 }, (_, i) => {
      const match = peakHours.find(h => h._id === i);
      return {
        hour: `${i.toString().padStart(2, '0')}:00`,
        orders: match ? match.orderCount : 0,
        revenue: match ? parseFloat(match.revenue.toFixed(2)) : 0.00
      };
    });

    // 8. Dynamic Pricing Impact (Compute revenue gain = sum(invoice.quantity * (priceAtOrder - basePrice)))
    const productsList = await Product.find({});
    const basePriceMap = {};
    productsList.forEach(p => {
      basePriceMap[p.name] = p.basePrice;
    });

    const allInvoices = await Invoice.find({ status: 'paid' });

    let basePriceTotal = 0.00;
    let actualPriceTotal = 0.00;

    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const itemQty = item.quantity;
        const actualPrice = item.priceAtOrder;
        
        // Find product base price, if deleted fallback to actualPrice
        const productBase = basePriceMap[item.name] !== undefined ? basePriceMap[item.name] : actualPrice;

        basePriceTotal += (productBase * itemQty);
        actualPriceTotal += (actualPrice * itemQty);
      });
    });

    const dynamicPricingImpact = parseFloat((actualPriceTotal - basePriceTotal).toFixed(2));

    // 9. Low Stock Warnings
    const lowStockItems = await Product.find({ stock: { $lte: 5 } }).populate('category');

    res.json({
      success: true,
      summary: {
        todayRevenue: parseFloat(todayRev.toFixed(2)),
        weekRevenue: parseFloat(weekRev.toFixed(2)),
        monthRevenue: parseFloat(monthRev.toFixed(2)),
        yearRevenue: parseFloat(yearRev.toFixed(2)),
        averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        customerCountToday: customerCount,
        tableOccupancyRate: parseFloat(tableOccupancyRate.toFixed(2)),
        reservations: {
          total: totalReservations,
          confirmed: confirmedReservations,
          pending: pendingReservations
        },
        dynamicPricingImpact,
        lowStockCount: lowStockItems.length
      },
      mostOrdered,
      leastOrdered,
      peakHours: formattedPeakHours,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
};
