const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Item = require('../models/Item');
const { auth, authorize, checkPermission } = require('../middleware/auth');
const QRCode = require('qrcode');

const router = express.Router();

// @route   GET /api/items
// @desc    Get all items with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 200 }).withMessage('Search term too long'),
  query('category').optional().trim().isLength({ max: 50 }).withMessage('Category name too long'),
  query('status').optional().isIn(['active', 'inactive', 'maintenance', 'retired', 'lost']).withMessage('Invalid status'),
  query('isCheckoutable').optional().isBoolean().withMessage('isCheckoutable must be boolean'),
  query('sortBy').optional().isIn(['name', 'category', 'createdAt', 'availableQuantity']).withMessage('Invalid sort field'),
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
      search,
      category,
      subcategory,
      status,
      isCheckoutable,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (status) filter.status = status;
    if (isCheckoutable !== undefined) filter.isCheckoutable = isCheckoutable === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const items = await Item.find(filter)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);

    res.json({
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Server error while fetching item' });
  }
});

// @route   POST /api/items
// @desc    Create new item
// @access  Private (requires item management permission)
router.post('/', auth, checkPermission('canManageItems'), [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required and must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('category').trim().isLength({ min: 1, max: 50 }).withMessage('Category is required and must be 1-50 characters'),
  body('subcategory').optional().trim().isLength({ max: 50 }).withMessage('Subcategory cannot exceed 50 characters'),
  body('totalQuantity').isInt({ min: 0 }).withMessage('Total quantity must be a non-negative integer'),
  body('availableQuantity').isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer'),
  body('unit').isIn(['piece', 'kg', 'g', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'set', 'pair', 'other']).withMessage('Invalid unit'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a non-negative number'),
  body('sku').optional().trim().isLength({ max: 50 }).withMessage('SKU cannot exceed 50 characters'),
  body('barcode').optional().trim().isLength({ max: 50 }).withMessage('Barcode cannot exceed 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const itemData = {
      ...req.body,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    // Ensure available quantity doesn't exceed total quantity
    if (itemData.availableQuantity > itemData.totalQuantity) {
      itemData.availableQuantity = itemData.totalQuantity;
    }

    const item = new Item(itemData);
    await item.save();

    // Generate QR code if not provided
    if (!item.qrCode) {
      item.qrCode = `ITEM_${item._id}`;
      await item.save();
    }

    await item.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (requires item management permission)
router.put('/:id', auth, checkPermission('canManageItems'), [
  body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Name must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('category').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category must be 1-50 characters'),
  body('subcategory').optional().trim().isLength({ max: 50 }).withMessage('Subcategory cannot exceed 50 characters'),
  body('totalQuantity').optional().isInt({ min: 0 }).withMessage('Total quantity must be a non-negative integer'),
  body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer'),
  body('unit').optional().isIn(['piece', 'kg', 'g', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'set', 'pair', 'other']).withMessage('Invalid unit'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a non-negative number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id
    };

    // Ensure available quantity doesn't exceed total quantity
    if (updateData.availableQuantity && updateData.totalQuantity) {
      if (updateData.availableQuantity > updateData.totalQuantity) {
        updateData.availableQuantity = updateData.totalQuantity;
      }
    } else if (updateData.totalQuantity && !updateData.availableQuantity) {
      if (item.availableQuantity > updateData.totalQuantity) {
        updateData.availableQuantity = updateData.totalQuantity;
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastModifiedBy', 'name email');

    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (requires item management permission)
router.delete('/:id', auth, checkPermission('canManageItems'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if item has active transactions
    const Transaction = require('../models/Transaction');
    const activeTransactions = await Transaction.countDocuments({
      item: req.params.id,
      status: { $in: ['pending', 'active', 'overdue'] }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete item with active transactions' 
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

// @route   GET /api/items/categories/list
// @desc    Get all categories
// @access  Private
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await Item.distinct('category');
    const subcategories = await Item.distinct('subcategory', { subcategory: { $exists: true, $ne: null } });
    
    res.json({
      categories: categories.sort(),
      subcategories: subcategories.sort()
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/items/:id/qr-code
// @desc    Generate QR code for item
// @access  Private
router.get('/:id/qr-code', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const qrCodeData = {
      id: item._id,
      name: item.name,
      sku: item.sku,
      type: 'item'
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData), {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      qrCode,
      data: qrCodeData
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Server error while generating QR code' });
  }
});

// @route   POST /api/items/bulk-import
// @desc    Bulk import items from CSV/JSON
// @access  Private (requires item management permission)
router.post('/bulk-import', auth, checkPermission('canManageItems'), async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const itemData of items) {
      try {
        const item = new Item({
          ...itemData,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        });
        
        await item.save();
        results.successful.push(item);
      } catch (error) {
        results.failed.push({
          data: itemData,
          error: error.message
        });
      }
    }

    res.json({
      message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

module.exports = router;