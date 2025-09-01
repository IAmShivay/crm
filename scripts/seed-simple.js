const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:9CJqBIBm4S7IVuPazC4wOE19ANUSSQErfi3SwxMqgf1wQ2PAfC9qjSkAMAxRHC0r@46.202.167.64:27202/?directConnection=true';

// Simple schemas for seeding
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  timezone: { type: String, default: 'UTC' },
  preferences: { type: Object, default: {} },
  emailConfirmed: { type: Boolean, default: true },
  emailConfirmedAt: Date,
  lastSignInAt: Date
}, { timestamps: true });

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  planId: { type: String, default: 'free' },
  subscriptionStatus: { type: String, default: 'active' }
}, { timestamps: true });

const RoleSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  permissions: [String],
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const WorkspaceMemberSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  status: { type: String, default: 'active' },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const PlanSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  interval: { type: String, required: true },
  features: [String],
  limits: Object,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

async function seedDatabase() {
  try {
    console.log('🌱 Starting MongoDB database seeding...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create models
    const User = mongoose.model('User', UserSchema);
    const Workspace = mongoose.model('Workspace', WorkspaceSchema);
    const Role = mongoose.model('Role', RoleSchema);
    const WorkspaceMember = mongoose.model('WorkspaceMember', WorkspaceMemberSchema);
    const Plan = mongoose.model('Plan', PlanSchema);

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Role.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await Plan.deleteMany({});

    // 1. Create Plans
    console.log('📋 Creating plans...');
    const plans = [
      {
        _id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        interval: 'month',
        features: ['Up to 100 leads', 'Basic lead management', 'Email support'],
        limits: { leads: 100, users: 2, workspaces: 1 },
        sortOrder: 1,
        isActive: true
      },
      {
        _id: 'starter',
        name: 'Starter',
        description: 'Great for small teams',
        price: 29,
        interval: 'month',
        features: ['Up to 1,000 leads', 'Advanced lead management', 'Role management', 'Email support', 'Basic analytics'],
        limits: { leads: 1000, users: 5, workspaces: 1 },
        sortOrder: 2,
        isActive: true
      },
      {
        _id: 'professional',
        name: 'Professional',
        description: 'For growing businesses',
        price: 79,
        interval: 'month',
        features: ['Up to 10,000 leads', 'Advanced analytics', 'Custom fields', 'API access', 'Priority support', 'Webhooks'],
        limits: { leads: 10000, users: 15, workspaces: 3 },
        sortOrder: 3,
        isActive: true
      },
      {
        _id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: 199,
        interval: 'month',
        features: ['Unlimited leads', 'Advanced integrations', 'Custom branding', 'Dedicated support', 'SLA guarantee', 'Advanced security'],
        limits: { leads: -1, users: -1, workspaces: -1 },
        sortOrder: 4,
        isActive: true
      }
    ];

    await Plan.insertMany(plans);
    console.log(`✅ Created ${plans.length} plans`);

    // 2. Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      email: 'admin@crm.com',
      password: adminPassword,
      fullName: 'System Administrator',
      timezone: 'UTC',
      emailConfirmed: true,
      emailConfirmedAt: new Date()
    });
    await adminUser.save();
    console.log('✅ Created admin user: admin@crm.com / admin123');

    // 3. Create Admin Workspace
    console.log('🏢 Creating admin workspace...');
    const adminWorkspace = new Workspace({
      name: 'Admin Workspace',
      slug: 'admin-workspace',
      planId: 'enterprise',
      subscriptionStatus: 'active'
    });
    await adminWorkspace.save();

    // 4. Create Default Roles
    console.log('🔐 Creating default roles...');
    const roles = [
      {
        workspaceId: adminWorkspace._id.toString(),
        name: 'Owner',
        description: 'Full access to workspace',
        permissions: ['*:*'],
        isDefault: false
      },
      {
        workspaceId: adminWorkspace._id.toString(),
        name: 'Admin',
        description: 'Administrative access',
        permissions: [
          'leads:create', 'leads:read', 'leads:update', 'leads:delete',
          'users:create', 'users:read', 'users:update', 'users:delete',
          'roles:create', 'roles:read', 'roles:update', 'roles:delete',
          'workspace:read', 'workspace:update',
          'analytics:read'
        ],
        isDefault: false
      },
      {
        workspaceId: adminWorkspace._id.toString(),
        name: 'Manager',
        description: 'Lead management and team oversight',
        permissions: [
          'leads:create', 'leads:read', 'leads:update', 'leads:delete',
          'users:read', 'analytics:read'
        ],
        isDefault: false
      },
      {
        workspaceId: adminWorkspace._id.toString(),
        name: 'Sales Rep',
        description: 'Basic lead management',
        permissions: [
          'leads:create', 'leads:read', 'leads:update'
        ],
        isDefault: true
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    const ownerRole = createdRoles.find(role => role.name === 'Owner');
    console.log(`✅ Created ${roles.length} roles`);

    // 5. Add Admin as Workspace Owner
    console.log('👥 Adding admin to workspace...');
    const adminMember = new WorkspaceMember({
      workspaceId: adminWorkspace._id.toString(),
      userId: adminUser._id.toString(),
      roleId: ownerRole._id.toString(),
      status: 'active',
      joinedAt: new Date()
    });
    await adminMember.save();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Seeded Data Summary:');
    console.log(`- Plans: ${plans.length}`);
    console.log(`- Admin User: admin@crm.com (password: admin123)`);
    console.log(`- Admin Workspace: ${adminWorkspace.name} (${adminWorkspace.slug})`);
    console.log(`- Roles: ${roles.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
