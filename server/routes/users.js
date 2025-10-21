const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering
// @access  Private (managers and admins)
router.get('/', auth, authorize('admin', 'manager'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Invalid role'),
  query('department').optional().trim().isLength({ max: 50 }).withMessage('Department name too long'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('search').optional().trim().isLength({ max: 200 }).withMessage('Search term too long'),
  query('sortBy').optional().isIn(['name', 'email', 'role', 'department', 'createdAt', 'lastLogin']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 20,
      role,
      department,
      isActive,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Users can only view their own profile unless they're managers/admins
    if (req.user.role === 'user' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (managers and admins, or users updating their own profile)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('department').optional().trim().isLength({ max: 50 }).withMessage('Department name too long'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Invalid phone number'),
  body('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('permissions').optional().isObject().withMessage('Permissions must be an object'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Check permissions
    const isOwnProfile = req.params.id === req.user._id.toString();
    const canManageUsers = req.user.permissions.canManageUsers || req.user.role === 'admin';

    if (!isOwnProfile && !canManageUsers) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = { ...req.body };

    // Regular users can only update certain fields
    if (req.user.role === 'user' && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (isOwnProfile && req.user.role === 'user') {
      // Users can only update their own basic info
      const allowedFields = ['name', 'department', 'phone', 'preferences'];
      updateData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});
    }

    // Only admins can change roles and permissions
    if (updateData.role && req.user.role !== 'admin') {
      delete updateData.role;
    }

    if (updateData.permissions && req.user.role !== 'admin') {
      delete updateData.permissions;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (deactivate)
// @access  Private (admins only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting own account
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user has active transactions
    const Transaction = require('../models/Transaction');
    const activeTransactions = await Transaction.countDocuments({
      user: req.params.id,
      status: { $in: ['pending', 'active', 'overdue'] }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active transactions' 
      });
    }

    // Deactivate user instead of deleting
    await User.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private (admins only)
router.put('/:id/permissions', auth, authorize('admin'), [
  body('permissions').isObject().withMessage('Permissions must be an object'),
  body('permissions.canCheckout').optional().isBoolean().withMessage('canCheckout must be boolean'),
  body('permissions.canManageItems').optional().isBoolean().withMessage('canManageItems must be boolean'),
  body('permissions.canManageUsers').optional().isBoolean().withMessage('canManageUsers must be boolean'),
  body('permissions.canViewAnalytics').optional().isBoolean().withMessage('canViewAnalytics must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { permissions: req.body.permissions },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User permissions updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ message: 'Server error while updating permissions' });
  }
});

// @route   GET /api/users/departments/list
// @desc    Get all departments
// @access  Private
router.get('/departments/list', auth, async (req, res) => {
  try {
    const departments = await User.distinct('department', { 
      department: { $exists: true, $ne: null, $ne: '' } 
    });
    
    res.json({
      departments: departments.sort()
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error while fetching departments' });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (managers and admins)
router.get('/stats/overview', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const usersByDepartment = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      usersByDepartment
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
});

module.exports = router;
