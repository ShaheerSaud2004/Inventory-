const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize, checkPermission } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions with filtering
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['checkout', 'return', 'reserve', 'cancel', 'maintenance', 'adjustment']).withMessage('Invalid transaction type'),
  query('status').optional().isIn(['pending', 'active', 'overdue', 'returned', 'cancelled', 'approved', 'rejected']).withMessage('Invalid status'),
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('itemId').optional().isMongoId().withMessage('Invalid item ID'),
  query('sortBy').optional().isIn(['checkoutDate', 'expectedReturnDate', 'createdAt']).withMessage('Invalid sort field'),
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
      status,
      userId,
      itemId,
      sortBy = 'checkoutDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (userId) filter.user = userId;
    if (itemId) filter.item = itemId;

    // Regular users can only see their own transactions
    if (req.user.role === 'user') {
      filter.user = req.user._id;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const transactions = await Transaction.find(filter)
      .populate('item', 'name sku category')
      .populate('user', 'name email department')
      .populate('createdBy', 'name email')
      .populate('approval.approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

// @route   POST /api/transactions/checkout
// @desc    Checkout items
// @access  Private (requires checkout permission)
router.post('/checkout', auth, checkPermission('canCheckout'), [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').isMongoId().withMessage('Invalid item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('expectedReturnDate').isISO8601().withMessage('Valid return date is required'),
  body('purpose').trim().isLength({ min: 1, max: 500 }).withMessage('Purpose is required and must be 1-500 characters'),
  body('project').optional().trim().isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { items, expectedReturnDate, purpose, project, location, notes } = req.body;

    // Validate all items and check availability
    const itemUpdates = [];
    const transactions = [];
    const requiresApproval = [];

    for (const itemRequest of items) {
      const item = await Item.findById(itemRequest.itemId);
      if (!item) {
        return res.status(404).json({ message: `Item ${itemRequest.itemId} not found` });
      }

      if (!item.isCheckoutable) {
        return res.status(400).json({ message: `Item ${item.name} is not available for checkout` });
      }

      if (item.availableQuantity < itemRequest.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${item.name}. Available: ${item.availableQuantity}, Requested: ${itemRequest.quantity}` 
        });
      }

      if (item.requiresApproval) {
        requiresApproval.push(item);
      }

      // Create transaction
      const transaction = new Transaction({
        type: 'checkout',
        item: item._id,
        user: req.user._id,
        quantity: itemRequest.quantity,
        expectedReturnDate: new Date(expectedReturnDate),
        purpose,
        project,
        location,
        notes,
        approval: {
          required: item.requiresApproval
        },
        status: item.requiresApproval ? 'pending' : 'active',
        createdBy: req.user._id
      });

      transactions.push(transaction);

      // Prepare item update
      itemUpdates.push({
        itemId: item._id,
        quantityToReserve: itemRequest.quantity
      });
    }

    // Save all transactions
    const savedTransactions = await Transaction.insertMany(transactions);

    // Update item quantities
    for (const update of itemUpdates) {
      await Item.findByIdAndUpdate(update.itemId, {
        $inc: {
          availableQuantity: -update.quantityToReserve,
          reservedQuantity: update.quantityToReserve
        }
      });
    }

    // Populate transactions for response
    const populatedTransactions = await Transaction.find({
      _id: { $in: savedTransactions.map(t => t._id) }
    })
    .populate('item', 'name sku category')
    .populate('user', 'name email department');

    // Send notifications
    for (const transaction of populatedTransactions) {
      // Create notification
      const notification = new Notification({
        type: 'checkout_confirmation',
        title: 'Checkout Confirmation',
        message: `You have successfully checked out ${transaction.quantity} x ${transaction.item.name}`,
        recipient: transaction.user._id,
        relatedTransaction: transaction._id,
        relatedItem: transaction.item._id,
        channels: [
          { type: 'email', status: 'pending' },
          { type: 'in_app', status: 'pending' }
        ]
      });
      await notification.save();

      // Send email notification
      try {
        await sendEmail({
          to: transaction.user.email,
          subject: 'Checkout Confirmation - Inventory Tracker',
          template: 'checkout_confirmation',
          data: {
            userName: transaction.user.name,
            itemName: transaction.item.name,
            quantity: transaction.quantity,
            expectedReturnDate: transaction.expectedReturnDate,
            purpose: transaction.purpose
          }
        });

        // Update notification status
        await Notification.findByIdAndUpdate(notification._id, {
          'channels.0.status': 'sent'
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        await Notification.findByIdAndUpdate(notification._id, {
          'channels.0.status': 'failed',
          'channels.0.error': emailError.message
        });
      }
    }

    // If approval is required, notify managers
    if (requiresApproval.length > 0) {
      const managers = await User.find({
        role: { $in: ['admin', 'manager'] },
        'permissions.canManageItems': true
      });

      for (const manager of managers) {
        const notification = new Notification({
          type: 'approval_request',
          title: 'Approval Required',
          message: `${req.user.name} has requested checkout of items that require approval`,
          recipient: manager._id,
          sender: req.user._id,
          channels: [
            { type: 'email', status: 'pending' },
            { type: 'in_app', status: 'pending' }
          ],
          priority: 'high'
        });
        await notification.save();
      }
    }

    res.status(201).json({
      message: requiresApproval.length > 0 
        ? 'Checkout request submitted for approval' 
        : 'Items checked out successfully',
      transactions: populatedTransactions,
      requiresApproval: requiresApproval.length > 0
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error during checkout' });
  }
});

// @route   POST /api/transactions/:id/return
// @desc    Return items
// @access  Private
router.post('/:id/return', auth, [
  body('condition').isIn(['excellent', 'good', 'fair', 'poor', 'damaged', 'lost']).withMessage('Valid condition is required'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { condition, notes } = req.body;

    const transaction = await Transaction.findById(req.params.id)
      .populate('item')
      .populate('user');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check permissions
    if (req.user.role === 'user' && transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only return your own items' });
    }

    if (transaction.status !== 'active' && transaction.status !== 'overdue') {
      return res.status(400).json({ message: 'Transaction is not in a returnable state' });
    }

    // Update transaction
    transaction.status = 'returned';
    transaction.actualReturnDate = new Date();
    transaction.condition.return = condition;
    if (notes) transaction.notes = notes;

    await transaction.save();

    // Update item quantities
    await Item.findByIdAndUpdate(transaction.item._id, {
      $inc: {
        availableQuantity: transaction.quantity,
        reservedQuantity: -transaction.quantity
      }
    });

    // Create return notification
    const notification = new Notification({
      type: 'return_confirmation',
      title: 'Return Confirmation',
      message: `You have successfully returned ${transaction.quantity} x ${transaction.item.name}`,
      recipient: transaction.user._id,
      relatedTransaction: transaction._id,
      relatedItem: transaction.item._id,
      channels: [
        { type: 'email', status: 'pending' },
        { type: 'in_app', status: 'pending' }
      ]
    });
    await notification.save();

    // Send email notification
    try {
      await sendEmail({
        to: transaction.user.email,
        subject: 'Return Confirmation - Inventory Tracker',
        template: 'return_confirmation',
        data: {
          userName: transaction.user.name,
          itemName: transaction.item.name,
          quantity: transaction.quantity,
          returnDate: transaction.actualReturnDate,
          condition: condition
        }
      });

      await Notification.findByIdAndUpdate(notification._id, {
        'channels.0.status': 'sent'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({
      message: 'Items returned successfully',
      transaction
    });
  } catch (error) {
    console.error('Return error:', error);
    res.status(500).json({ message: 'Server error during return' });
  }
});

// @route   POST /api/transactions/:id/approve
// @desc    Approve transaction
// @access  Private (requires approval permission)
router.post('/:id/approve', auth, authorize('admin', 'manager'), [
  body('approved').isBoolean().withMessage('Approval status is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Approval notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { approved, notes } = req.body;

    const transaction = await Transaction.findById(req.params.id)
      .populate('item')
      .populate('user');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending approval' });
    }

    // Update transaction
    transaction.status = approved ? 'active' : 'rejected';
    transaction.approval.approvedBy = req.user._id;
    transaction.approval.approvedAt = new Date();
    transaction.approval.approvalNotes = notes;

    await transaction.save();

    if (approved) {
      // Update item quantities
      await Item.findByIdAndUpdate(transaction.item._id, {
        $inc: {
          availableQuantity: -transaction.quantity,
          reservedQuantity: transaction.quantity
        }
      });
    } else {
      // Release reserved quantity
      await Item.findByIdAndUpdate(transaction.item._id, {
        $inc: {
          reservedQuantity: -transaction.quantity
        }
      });
    }

    // Create approval notification
    const notification = new Notification({
      type: 'approval_decision',
      title: approved ? 'Checkout Approved' : 'Checkout Rejected',
      message: `Your checkout request for ${transaction.item.name} has been ${approved ? 'approved' : 'rejected'}`,
      recipient: transaction.user._id,
      sender: req.user._id,
      relatedTransaction: transaction._id,
      relatedItem: transaction.item._id,
      channels: [
        { type: 'email', status: 'pending' },
        { type: 'in_app', status: 'pending' }
      ]
    });
    await notification.save();

    res.json({
      message: `Transaction ${approved ? 'approved' : 'rejected'} successfully`,
      transaction
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Server error during approval' });
  }
});

// @route   GET /api/transactions/overdue
// @desc    Get overdue transactions
// @access  Private (managers and admins)
router.get('/overdue', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const overdueTransactions = await Transaction.find({
      type: 'checkout',
      status: { $in: ['active', 'overdue'] },
      expectedReturnDate: { $lt: new Date() }
    })
    .populate('item', 'name sku category')
    .populate('user', 'name email department phone')
    .sort({ expectedReturnDate: 1 });

    res.json({
      transactions: overdueTransactions,
      count: overdueTransactions.length
    });
  } catch (error) {
    console.error('Get overdue transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching overdue transactions' });
  }
});

// @route   POST /api/transactions/:id/extend
// @desc    Request extension for transaction
// @access  Private
router.post('/:id/extend', auth, [
  body('newReturnDate').isISO8601().withMessage('Valid new return date is required'),
  body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('Extension reason is required and must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { newReturnDate, reason } = req.body;

    const transaction = await Transaction.findById(req.params.id)
      .populate('item')
      .populate('user');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check permissions
    if (req.user.role === 'user' && transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only extend your own transactions' });
    }

    if (transaction.status !== 'active' && transaction.status !== 'overdue') {
      return res.status(400).json({ message: 'Transaction is not in an extendable state' });
    }

    // Add extension request
    transaction.extensions.push({
      newReturnDate: new Date(newReturnDate),
      reason,
      status: 'pending'
    });

    await transaction.save();

    // Notify managers
    const managers = await User.find({
      role: { $in: ['admin', 'manager'] },
      'permissions.canManageItems': true
    });

    for (const manager of managers) {
      const notification = new Notification({
        type: 'extension_request',
        title: 'Extension Request',
        message: `${req.user.name} has requested an extension for ${transaction.item.name}`,
        recipient: manager._id,
        sender: req.user._id,
        relatedTransaction: transaction._id,
        channels: [
          { type: 'email', status: 'pending' },
          { type: 'in_app', status: 'pending' }
        ],
        priority: 'medium'
      });
      await notification.save();
    }

    res.json({
      message: 'Extension request submitted successfully',
      transaction
    });
  } catch (error) {
    console.error('Extension request error:', error);
    res.status(500).json({ message: 'Server error during extension request' });
  }
});

module.exports = router;
