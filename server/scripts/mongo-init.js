// MongoDB initialization script
db = db.getSiblingDB('inventory_tracker');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Name must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address and is required'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be a string with minimum 6 characters and is required'
        },
        role: {
          enum: ['admin', 'manager', 'user'],
          description: 'Role must be one of: admin, manager, user and is required'
        }
      }
    }
  }
});

db.createCollection('items', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'category', 'totalQuantity', 'availableQuantity', 'unit', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Item name must be a string and is required'
        },
        category: {
          bsonType: 'string',
          description: 'Category must be a string and is required'
        },
        totalQuantity: {
          bsonType: 'number',
          minimum: 0,
          description: 'Total quantity must be a non-negative number and is required'
        },
        availableQuantity: {
          bsonType: 'number',
          minimum: 0,
          description: 'Available quantity must be a non-negative number and is required'
        },
        unit: {
          enum: ['piece', 'kg', 'g', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'set', 'pair', 'other'],
          description: 'Unit must be one of the predefined values and is required'
        }
      }
    }
  }
});

db.createCollection('transactions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'item', 'user', 'quantity', 'purpose', 'createdBy'],
      properties: {
        type: {
          enum: ['checkout', 'return', 'reserve', 'cancel', 'maintenance', 'adjustment'],
          description: 'Transaction type must be one of the predefined values and is required'
        },
        quantity: {
          bsonType: 'number',
          minimum: 1,
          description: 'Quantity must be a positive number and is required'
        },
        status: {
          enum: ['pending', 'active', 'overdue', 'returned', 'cancelled', 'approved', 'rejected'],
          description: 'Status must be one of the predefined values'
        }
      }
    }
  }
});

db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.items.createIndex({ name: 'text', description: 'text', category: 'text' });
db.items.createIndex({ sku: 1 }, { unique: true, sparse: true });
db.items.createIndex({ barcode: 1 }, { unique: true, sparse: true });
db.items.createIndex({ qrCode: 1 }, { unique: true, sparse: true });
db.items.createIndex({ category: 1, subcategory: 1 });
db.items.createIndex({ status: 1 });
db.items.createIndex({ isCheckoutable: 1 });

db.transactions.createIndex({ item: 1, status: 1 });
db.transactions.createIndex({ user: 1, status: 1 });
db.transactions.createIndex({ type: 1, status: 1 });
db.transactions.createIndex({ checkoutDate: -1 });
db.transactions.createIndex({ expectedReturnDate: 1 });
db.transactions.createIndex({ status: 1, expectedReturnDate: 1 });

db.notifications.createIndex({ recipient: 1, isRead: 1, createdAt: -1 });
db.notifications.createIndex({ type: 1, scheduledFor: 1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('✅ Database initialized successfully!');
