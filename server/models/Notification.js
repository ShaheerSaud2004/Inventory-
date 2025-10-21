const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
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
    ],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  channels: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
      default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    error: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Index for better performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set readAt when isRead becomes true
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);

