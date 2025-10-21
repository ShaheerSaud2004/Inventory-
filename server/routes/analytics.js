const express = require('express');
const { query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private (managers and admins)
router.get('/dashboard', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Basic counts
    const totalItems = await Item.countDocuments();
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalTransactions = await Transaction.countDocuments();
    const activeTransactions = await Transaction.countDocuments({
      status: { $in: ['active', 'overdue'] }
    });

    // Overdue items
    const overdueTransactions = await Transaction.countDocuments({
      type: 'checkout',
      status: { $in: ['active', 'overdue'] },
      expectedReturnDate: { $lt: new Date() }
    });

    // Recent activity (last 7 days)
    const recentActivity = await Transaction.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('item', 'name category')
    .populate('user', 'name department')
    .sort({ createdAt: -1 })
    .limit(10);

    // Top checked out items
    const topItems = await Transaction.aggregate([
      { $match: { type: 'checkout' } },
      { $group: { _id: '$item', totalCheckouts: { $sum: '$quantity' } } },
      { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $project: { 
        itemName: '$item.name', 
        itemCategory: '$item.category',
        totalCheckouts: 1 
      } },
      { $sort: { totalCheckouts: -1 } },
      { $limit: 10 }
    ]);

    // Users with most checkouts
    const topUsers = await Transaction.aggregate([
      { $match: { type: 'checkout' } },
      { $group: { _id: '$user', totalCheckouts: { $sum: '$quantity' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 
        userName: '$user.name', 
        userDepartment: '$user.department',
        totalCheckouts: 1 
      } },
      { $sort: { totalCheckouts: -1 } },
      { $limit: 10 }
    ]);

    // Category distribution
    const categoryStats = await Item.aggregate([
      { $group: { 
        _id: '$category', 
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$totalQuantity' },
        availableQuantity: { $sum: '$availableQuantity' }
      } },
      { $sort: { totalItems: -1 } }
    ]);

    res.json({
      overview: {
        totalItems,
        totalUsers,
        totalTransactions,
        activeTransactions,
        overdueTransactions
      },
      recentActivity,
      topItems,
      topUsers,
      categoryStats
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard analytics' });
  }
});

// @route   GET /api/analytics/transactions
// @desc    Get transaction analytics
// @access  Private (managers and admins)
router.get('/transactions', auth, authorize('admin', 'manager'), [
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Transaction trends over time
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = { $week: '$createdAt' };
        break;
      case 'month':
        dateFormat = { $month: '$createdAt' };
        break;
      default:
        dateFormat = { $dayOfYear: '$createdAt' };
    }

    const transactionTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: dateFormat,
            type: '$type'
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Transaction status distribution
    const statusDistribution = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average checkout duration
    const avgCheckoutDuration = await Transaction.aggregate([
      {
        $match: {
          type: 'checkout',
          status: 'returned',
          actualReturnDate: { $exists: true },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ['$actualReturnDate', '$checkoutDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Overdue rate
    const overdueStats = await Transaction.aggregate([
      {
        $match: {
          type: 'checkout',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          overdue: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ['$status', 'returned'] },
                  { $lt: ['$expectedReturnDate', new Date()] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      dateRange: { start, end },
      transactionTrends,
      statusDistribution,
      avgCheckoutDuration: avgCheckoutDuration[0]?.avgDuration || 0,
      overdueStats: overdueStats[0] || { total: 0, overdue: 0 }
    });
  } catch (error) {
    console.error('Transaction analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction analytics' });
  }
});

// @route   GET /api/analytics/items
// @desc    Get item analytics
// @access  Private (managers and admins)
router.get('/items', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Item status distribution
    const statusDistribution = await Item.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Low stock items
    const lowStockItems = await Item.find({
      $expr: {
        $lte: ['$availableQuantity', { $multiply: ['$totalQuantity', 0.1] }] // 10% threshold
      }
    }).select('name category availableQuantity totalQuantity');

    // Most/least used items
    const itemUsage = await Transaction.aggregate([
      { $match: { type: 'checkout' } },
      { $group: { _id: '$item', totalCheckouts: { $sum: '$quantity' } } },
      { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $project: { 
        itemName: '$item.name',
        itemCategory: '$item.category',
        totalCheckouts: 1,
        availableQuantity: '$item.availableQuantity'
      } },
      { $sort: { totalCheckouts: -1 } }
    ]);

    const mostUsed = itemUsage.slice(0, 10);
    const leastUsed = itemUsage.slice(-10).reverse();

    // Category performance
    const categoryPerformance = await Item.aggregate([
      {
        $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'item',
          as: 'transactions'
        }
      },
      {
        $project: {
          category: 1,
          totalQuantity: 1,
          availableQuantity: 1,
          totalCheckouts: {
            $sum: {
              $map: {
                input: '$transactions',
                as: 'txn',
                in: { $cond: [{ $eq: ['$$txn.type', 'checkout'] }, '$$txn.quantity', 0] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          totalCheckouts: { $sum: '$totalCheckouts' }
        }
      },
      {
        $addFields: {
          utilizationRate: {
            $cond: [
              { $gt: ['$totalQuantity', 0] },
              { $multiply: [{ $divide: ['$totalCheckouts', '$totalQuantity'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { utilizationRate: -1 } }
    ]);

    res.json({
      statusDistribution,
      lowStockItems,
      mostUsedItems: mostUsed,
      leastUsedItems: leastUsed,
      categoryPerformance
    });
  } catch (error) {
    console.error('Item analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching item analytics' });
  }
});

// @route   GET /api/analytics/users
// @desc    Get user analytics
// @access  Private (managers and admins)
router.get('/users', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    // User activity stats
    const userActivity = await Transaction.aggregate([
      { $match: { type: 'checkout' } },
      { $group: { 
        _id: '$user', 
        totalCheckouts: { $sum: '$quantity' },
        uniqueItems: { $addToSet: '$item' },
        lastActivity: { $max: '$createdAt' }
      } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 
        userName: '$user.name',
        userEmail: '$user.email',
        userDepartment: '$user.department',
        totalCheckouts: 1,
        uniqueItemCount: { $size: '$uniqueItems' },
        lastActivity: 1
      } },
      { $sort: { totalCheckouts: -1 } }
    ]);

    // Department usage
    const departmentUsage = await Transaction.aggregate([
      { $match: { type: 'checkout' } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: { 
        _id: '$user.department', 
        totalCheckouts: { $sum: '$quantity' },
        uniqueUsers: { $addToSet: '$user._id' }
      } },
      { $project: { 
        department: '$_id',
        totalCheckouts: 1,
        userCount: { $size: '$uniqueUsers' }
      } },
      { $sort: { totalCheckouts: -1 } }
    ]);

    // User compliance (overdue rates)
    const userCompliance = await Transaction.aggregate([
      { $match: { type: 'checkout' } },
      { $group: { 
        _id: '$user', 
        totalCheckouts: { $sum: 1 },
        overdueCheckouts: {
          $sum: {
            $cond: [
              { $and: [
                { $ne: ['$status', 'returned'] },
                { $lt: ['$expectedReturnDate', new Date()] }
              ]},
              1,
              0
            ]
          }
        }
      } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 
        userName: '$user.name',
        userDepartment: '$user.department',
        totalCheckouts: 1,
        overdueCheckouts: 1,
        complianceRate: {
          $multiply: [
            { $divide: [{ $subtract: ['$totalCheckouts', '$overdueCheckouts'] }, '$totalCheckouts'] },
            100
          ]
        }
      } },
      { $sort: { complianceRate: 1 } } // Sort by worst compliance first
    ]);

    res.json({
      userActivity,
      departmentUsage,
      userCompliance
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching user analytics' });
  }
});

// @route   GET /api/analytics/reports/export
// @desc    Export analytics data
// @access  Private (managers and admins)
router.get('/reports/export', auth, authorize('admin', 'manager'), [
  query('type').isIn(['transactions', 'items', 'users', 'overdue']).withMessage('Valid report type is required'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type, format = 'json', startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let data;

    switch (type) {
      case 'transactions':
        data = await Transaction.find({
          createdAt: { $gte: start, $lte: end }
        })
        .populate('item', 'name sku category')
        .populate('user', 'name email department')
        .sort({ createdAt: -1 });
        break;

      case 'items':
        data = await Item.find()
        .populate('createdBy', 'name email')
        .sort({ name: 1 });
        break;

      case 'users':
        data = await User.find({ isActive: true })
        .select('-password')
        .sort({ name: 1 });
        break;

      case 'overdue':
        data = await Transaction.find({
          type: 'checkout',
          status: { $in: ['active', 'overdue'] },
          expectedReturnDate: { $lt: new Date() }
        })
        .populate('item', 'name sku category')
        .populate('user', 'name email department phone')
        .sort({ expectedReturnDate: 1 });
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    res.json({
      reportType: type,
      dateRange: { start, end },
      generatedAt: new Date(),
      data
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

module.exports = router;
