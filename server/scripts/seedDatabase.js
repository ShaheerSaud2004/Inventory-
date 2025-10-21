const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Item = require('../models/Item');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_tracker');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      department: 'IT',
      phone: '+1234567890',
      permissions: {
        canCheckout: true,
        canManageItems: true,
        canManageUsers: true,
        canViewAnalytics: true
      }
    });
    await adminUser.save();
    console.log('👤 Created admin user');

    // Create manager user
    const managerUser = new User({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'manager123',
      role: 'manager',
      department: 'Operations',
      phone: '+1234567891',
      permissions: {
        canCheckout: true,
        canManageItems: true,
        canManageUsers: false,
        canViewAnalytics: true
      }
    });
    await managerUser.save();
    console.log('👤 Created manager user');

    // Create regular user
    const regularUser = new User({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
      department: 'Engineering',
      phone: '+1234567892',
      permissions: {
        canCheckout: true,
        canManageItems: false,
        canManageUsers: false,
        canViewAnalytics: false
      }
    });
    await regularUser.save();
    console.log('👤 Created regular user');

    // Create sample items
    const sampleItems = [
      {
        name: 'Laptop - Dell XPS 13',
        description: 'High-performance laptop for development work',
        category: 'Electronics',
        subcategory: 'Computers',
        sku: 'LAP-DELL-XPS13-001',
        totalQuantity: 10,
        availableQuantity: 8,
        unit: 'piece',
        cost: 1200,
        value: 1500,
        location: {
          building: 'Main Office',
          floor: '2nd Floor',
          room: 'IT Storage',
          shelf: 'A-1'
        },
        tags: ['laptop', 'development', 'portable'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Projector - Epson PowerLite',
        description: 'HD projector for presentations and meetings',
        category: 'Electronics',
        subcategory: 'Audio/Visual',
        sku: 'PROJ-EPSON-PL-002',
        totalQuantity: 5,
        availableQuantity: 4,
        unit: 'piece',
        cost: 800,
        value: 1000,
        location: {
          building: 'Main Office',
          floor: '1st Floor',
          room: 'Conference Room Storage',
          shelf: 'B-2'
        },
        tags: ['projector', 'presentation', 'meeting'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Safety Helmet - Hard Hat',
        description: 'Industrial safety helmet for construction sites',
        category: 'Safety Equipment',
        subcategory: 'Head Protection',
        sku: 'SAFE-HELMET-003',
        totalQuantity: 50,
        availableQuantity: 45,
        unit: 'piece',
        cost: 25,
        value: 35,
        location: {
          building: 'Warehouse',
          floor: 'Ground Floor',
          room: 'Safety Equipment',
          shelf: 'C-1'
        },
        tags: ['safety', 'helmet', 'construction'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Tool Set - Complete',
        description: 'Complete set of hand tools for maintenance work',
        category: 'Tools',
        subcategory: 'Hand Tools',
        sku: 'TOOL-SET-004',
        totalQuantity: 15,
        availableQuantity: 12,
        unit: 'set',
        cost: 150,
        value: 200,
        location: {
          building: 'Maintenance',
          floor: 'Ground Floor',
          room: 'Tool Storage',
          shelf: 'D-3'
        },
        tags: ['tools', 'maintenance', 'hand-tools'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Office Chair - Ergonomic',
        description: 'Ergonomic office chair for comfortable work',
        category: 'Furniture',
        subcategory: 'Seating',
        sku: 'FURN-CHAIR-005',
        totalQuantity: 25,
        availableQuantity: 20,
        unit: 'piece',
        cost: 300,
        value: 400,
        location: {
          building: 'Main Office',
          floor: '3rd Floor',
          room: 'Furniture Storage',
          shelf: 'E-2'
        },
        tags: ['chair', 'ergonomic', 'office'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      }
    ];

    for (const itemData of sampleItems) {
      const item = new Item(itemData);
      await item.save();
    }
    console.log('📦 Created sample items');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('User: user@example.com / user123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedDatabase();
