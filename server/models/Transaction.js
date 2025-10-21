const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['checkout', 'return', 'reserve', 'cancel', 'maintenance', 'adjustment'],
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  checkoutDate: {
    type: Date,
    default: Date.now
  },
  expectedReturnDate: {
    type: Date,
    required: function() {
      return this.type === 'checkout' || this.type === 'reserve';
    }
  },
  actualReturnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'overdue', 'returned', 'cancelled', 'approved', 'rejected'],
    default: 'pending'
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  project: {
    type: String,
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  condition: {
    checkout: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    return: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'lost'],
      default: null
    }
  },
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    approvalNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Approval notes cannot exceed 500 characters']
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    message: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  extensions: [{
    requestedAt: {
      type: Date,
      default: Date.now
    },
    newReturnDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Extension reason cannot exceed 500 characters']
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  penalties: [{
    type: {
      type: String,
      enum: ['late_fee', 'damage_fee', 'replacement_cost'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for checking if transaction is overdue
transactionSchema.virtual('isOverdue').get(function() {
  if (this.type !== 'checkout' || this.status === 'returned') return false;
  return new Date() > this.expectedReturnDate;
});

// Virtual for calculating days overdue
transactionSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.expectedReturnDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating total penalty amount
transactionSchema.virtual('totalPenalties').get(function() {
  return this.penalties.reduce((total, penalty) => total + penalty.amount, 0);
});

// Pre-save middleware to update status based on dates
transactionSchema.pre('save', function(next) {
  if (this.type === 'checkout' && this.status === 'active') {
    if (this.isOverdue) {
      this.status = 'overdue';
    }
  }
  next();
});

// Indexes for better performance
transactionSchema.index({ item: 1, status: 1 });
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ checkoutDate: -1 });
transactionSchema.index({ expectedReturnDate: 1 });
transactionSchema.index({ status: 1, expectedReturnDate: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

