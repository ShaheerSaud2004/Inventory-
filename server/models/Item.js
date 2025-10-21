const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative']
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Reserved quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['piece', 'kg', 'g', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'set', 'pair', 'other'],
    default: 'piece'
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  value: {
    type: Number,
    min: [0, 'Value cannot be negative']
  },
  location: {
    building: {
      type: String,
      trim: true,
      maxlength: [50, 'Building name cannot exceed 50 characters']
    },
    floor: {
      type: String,
      trim: true,
      maxlength: [20, 'Floor cannot exceed 20 characters']
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, 'Room cannot exceed 50 characters']
    },
    shelf: {
      type: String,
      trim: true,
      maxlength: [50, 'Shelf cannot exceed 50 characters']
    },
    position: {
      type: String,
      trim: true,
      maxlength: [50, 'Position cannot exceed 50 characters']
    }
  },
  images: [{
    url: String,
    alt: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  maintenanceSchedule: {
    type: {
      type: String,
      enum: ['none', 'monthly', 'quarterly', 'yearly', 'custom']
    },
    interval: Number, // in days
    lastMaintenance: Date,
    nextMaintenance: Date,
    notes: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'retired', 'lost'],
    default: 'active'
  },
  isCheckoutable: {
    type: Boolean,
    default: true
  },
  maxCheckoutDuration: {
    type: Number, // in days
    default: 7
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for checking if item is available
itemSchema.virtual('isAvailable').get(function() {
  return this.availableQuantity > 0 && this.status === 'active' && this.isCheckoutable;
});

// Virtual for checking if item is low stock
itemSchema.virtual('isLowStock').get(function() {
  return this.availableQuantity <= (this.totalQuantity * 0.1); // 10% threshold
});

// Pre-save middleware to ensure available quantity doesn't exceed total
itemSchema.pre('save', function(next) {
  if (this.availableQuantity > this.totalQuantity) {
    this.availableQuantity = this.totalQuantity;
  }
  if (this.availableQuantity + this.reservedQuantity > this.totalQuantity) {
    this.reservedQuantity = this.totalQuantity - this.availableQuantity;
  }
  next();
});

// Indexes for better performance
itemSchema.index({ name: 'text', description: 'text', category: 'text' });
itemSchema.index({ sku: 1 });
itemSchema.index({ barcode: 1 });
itemSchema.index({ qrCode: 1 });
itemSchema.index({ category: 1, subcategory: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ isCheckoutable: 1 });
itemSchema.index({ 'location.building': 1, 'location.room': 1 });

module.exports = mongoose.model('Item', itemSchema);

