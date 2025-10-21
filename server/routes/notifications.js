const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Notification = require('../models/Notification');
const { auth, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn([
    'checkout_confirmation',
    'return_reminder',
    'overdue_alert',
    'approval_request',
    'approval_decision',
    'item_available',
    'maintenance_due',
    'system_alert',
    'bulk_operation',
    'penalty_applied'
  ]).withMessage('Invalid notification type'),
  query('isRead').optional().isBoolean().withMessage('isRead must be boolean'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('sortBy').optional().isIn(['createdAt', 'priority', 'scheduledFor']).withMessage('Invalid sort field'),
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
      type,
      isRead,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { recipient: req.user._id };
    
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (priority) filter.priority = priority;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const notifications = await Notification.find(filter)
      .populate('sender', 'name email')
      .populate('relatedTransaction')
      .populate('relatedItem', 'name sku')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all notifications
// @access  Private
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id
    });

    res.json({
      message: 'All notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ message: 'Server error while clearing notifications' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

// @route   POST /api/notifications
// @desc    Create notification (admin/manager only)
// @access  Private (managers and admins)
router.post('/', auth, authorize('admin', 'manager'), [
  body('type').isIn([
    'checkout_confirmation',
    'return_reminder',
    'overdue_alert',
    'approval_request',
    'approval_decision',
    'item_available',
    'maintenance_due',
    'system_alert',
    'bulk_operation',
    'penalty_applied'
  ]).withMessage('Invalid notification type'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be 1-200 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be 1-1000 characters'),
  body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('channels').optional().isArray().withMessage('Channels must be an array'),
  body('scheduledFor').optional().isISO8601().withMessage('Valid scheduled date is required')
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
      type,
      title,
      message,
      recipient,
      priority = 'medium',
      channels = [{ type: 'in_app', status: 'pending' }],
      scheduledFor = new Date(),
      metadata = {}
    } = req.body;

    const notification = new Notification({
      type,
      title,
      message,
      recipient,
      sender: req.user._id,
      priority,
      channels,
      scheduledFor,
      metadata
    });

    await notification.save();

    await notification.populate('recipient', 'name email');

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error while creating notification' });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private (managers and admins)
router.get('/stats', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    const notificationsByType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const notificationsByPriority = await Notification.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const recentNotifications = await Notification.find()
      .populate('recipient', 'name email')
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalNotifications,
      unreadNotifications,
      readNotifications: totalNotifications - unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentNotifications
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ message: 'Server error while fetching notification statistics' });
  }
});

module.exports = router;
