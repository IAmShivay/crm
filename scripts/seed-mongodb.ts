import connectToMongoDB from '../lib/mongodb/connection.js';
import {
  User,
  Workspace,
  WorkspaceMember,
  Role,
  Plan,
  Subscription
} from '../lib/mongodb/models/index.js';
import { hashPassword } from '../lib/mongodb/auth.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting MongoDB database seeding...');
    
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await Role.deleteMany({});
    await Plan.deleteMany({});
    await Subscription.deleteMany({});

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
    const adminPassword = await hashPassword('admin123');
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
        workspaceId: adminWorkspace._id,
        name: 'Owner',
        description: 'Full access to workspace',
        permissions: ['*:*'],
        isDefault: false
      },
      {
        workspaceId: adminWorkspace._id,
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
        workspaceId: adminWorkspace._id,
        name: 'Manager',
        description: 'Lead management and team oversight',
        permissions: [
          'leads:create', 'leads:read', 'leads:update', 'leads:delete',
          'users:read', 'analytics:read'
        ],
        isDefault: false
      },
      {
        workspaceId: adminWorkspace._id,
        name: 'Sales Rep',
        description: 'Basic lead management',
        permissions: [
          'leads:create', 'leads:read', 'leads:update'
        ],
        isDefault: true
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    const ownerRole = createdRoles.find((role: any) => role.name === 'Owner');
    console.log(`✅ Created ${roles.length} roles`);

    // 5. Add Admin as Workspace Owner
    console.log('👥 Adding admin to workspace...');
    const adminMember = new WorkspaceMember({
      workspaceId: adminWorkspace._id,
      userId: adminUser._id,
      roleId: ownerRole!._id,
      status: 'active',
      joinedAt: new Date()
    });
    await adminMember.save();

    // 6. Create Subscription for Admin Workspace
    console.log('💳 Creating admin subscription...');
    const adminSubscription = new Subscription({
      workspaceId: adminWorkspace._id,
      planId: 'enterprise',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      cancelAtPeriodEnd: false
    });
    await adminSubscription.save();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Seeded Data Summary:');
    console.log(`- Plans: ${plans.length}`);
    console.log(`- Admin User: admin@crm.com (password: admin123)`);
    console.log(`- Admin Workspace: ${adminWorkspace.name} (${adminWorkspace.slug})`);
    console.log(`- Roles: ${roles.length}`);
    console.log(`- Subscription: Enterprise plan for admin workspace`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
