/**
 * Global Test Setup
 * 
 * This file runs once before all tests and sets up the global test environment,
 * including database connections, test data, and other shared resources.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

module.exports = async () => {
  console.log('🚀 Setting up global test environment...');
  
  try {
    // Start MongoDB Memory Server
    mongod = await MongoMemoryServer.create({
      binary: {
        version: '6.0.0',
      },
      instance: {
        dbName: 'crm-test',
      },
    });
    
    const uri = mongod.getUri();
    
    // Store the URI for use in tests
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_TEST_URI = uri;
    
    console.log('✅ MongoDB Memory Server started:', uri);
    
    // Connect to the database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to test database');
    
    // Create test indexes and initial data if needed
    await setupTestData();
    
    console.log('✅ Global test setup completed');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
};

async function setupTestData() {
  try {
    // Create collections and indexes that would normally be created by the application
    const db = mongoose.connection.db;
    
    // Create collections
    const collections = [
      'users',
      'workspaces',
      'workspacemembers',
      'roles',
      'plans',
      'subscriptions',
      'leads',
      'activities',
      'invitations'
    ];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        // Collection might already exist, ignore error
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️ Warning creating collection ${collectionName}:`, error.message);
        }
      }
    }
    
    // Create basic test plans
    const plansCollection = db.collection('plans');
    await plansCollection.deleteMany({}); // Clear existing
    
    const testPlans = [
      {
        _id: 'free',
        name: 'Free',
        description: 'Free plan for testing',
        price: 0,
        interval: 'month',
        features: ['Up to 100 leads', 'Basic features'],
        limits: { leads: 100, users: 2, workspaces: 1 },
        isActive: true,
        sortOrder: 1,
      },
      {
        _id: 'pro',
        name: 'Pro',
        description: 'Pro plan for testing',
        price: 29,
        interval: 'month',
        features: ['Up to 1000 leads', 'Advanced features'],
        limits: { leads: 1000, users: 10, workspaces: 3 },
        isActive: true,
        sortOrder: 2,
      },
    ];
    
    await plansCollection.insertMany(testPlans);
    console.log('✅ Created test plans');
    
    // Create test roles
    const rolesCollection = db.collection('roles');
    await rolesCollection.deleteMany({});
    
    const testRoles = [
      {
        _id: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Owner',
        description: 'Full access to workspace',
        permissions: ['*:*'],
        isDefault: true,
        isSystemRole: true,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Admin',
        description: 'Administrative access',
        permissions: ['leads:*', 'users:*', 'roles:read'],
        isDefault: false,
        isSystemRole: true,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'User',
        description: 'Basic user access',
        permissions: ['leads:read', 'leads:create', 'leads:update'],
        isDefault: false,
        isSystemRole: true,
      },
    ];
    
    await rolesCollection.insertMany(testRoles);
    console.log('✅ Created test roles');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

// Store the mongod instance globally so it can be accessed in teardown
global.__MONGOD__ = mongod;
