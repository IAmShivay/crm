# MongoDB Migration Guide

This guide will help you migrate your CRM system from Supabase (PostgreSQL) to MongoDB while preserving all functionality.

## Prerequisites

1. **MongoDB installed locally or MongoDB Atlas account**
   - Local: Download from https://www.mongodb.com/try/download/community
   - Cloud: Create account at https://cloud.mongodb.com

2. **Node.js dependencies installed**
   ```bash
   npm install --legacy-peer-deps
   ```

## Migration Steps

### Step 1: Set up MongoDB Connection

1. **Update your `.env.local` file:**
   ```env
   # For local MongoDB
   MONGODB_URI=mongodb://localhost:27017/crm_database
   
   # For MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_database
   
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ```

2. **Start MongoDB locally (if using local installation):**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

### Step 2: Choose Migration Path

#### Option A: Fresh Start with Seeded Data (Recommended)
```bash
npm run db:seed
```
This will create:
- Default plans (Free, Starter, Professional, Enterprise)
- Admin user: `admin@crm.com` / `admin123`
- Admin workspace with full permissions
- Default roles (Owner, Admin, Manager, Sales Rep)

#### Option B: Migrate Existing Supabase Data
```bash
npm run db:migrate
```
This will:
- Export all data from your current Supabase database
- Transform and import it into MongoDB
- Preserve all relationships and data integrity
- Set temporary passwords for all users

### Step 3: Update Application Configuration

The following files have been updated to use MongoDB:

1. **Database Models**: `lib/mongodb/models/`
   - User, Workspace, Role, Lead, Plan, etc.

2. **Authentication**: `lib/mongodb/auth.ts`
   - JWT-based authentication
   - Password hashing with bcrypt

3. **API Layer**: `lib/api/mongoApi.ts`
   - RTK Query endpoints for MongoDB

4. **Store Configuration**: `lib/store.ts`
   - Updated to use mongoApi instead of supabaseApi

### Step 4: Test the Migration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test login with admin credentials:**
   - Email: `admin@crm.com`
   - Password: `admin123`

3. **Verify functionality:**
   - Create/view leads
   - Manage roles and permissions
   - Workspace operations

## Key Changes Made

### Database Schema Mapping

| Supabase Table | MongoDB Collection | Key Changes |
|----------------|-------------------|-------------|
| `auth.users` + `user_profiles` | `users` | Combined into single collection |
| `workspaces` | `workspaces` | Direct mapping |
| `workspace_members` | `workspacemembers` | Direct mapping |
| `roles` | `roles` | Direct mapping |
| `leads` | `leads` | Direct mapping |
| `plans` | `plans` | Direct mapping |
| `subscriptions` | `subscriptions` | Direct mapping |

### Authentication Changes

- **Before**: Supabase Auth with RLS policies
- **After**: JWT-based authentication with MongoDB
- **Security**: Maintained through application-level checks

### API Changes

- **Before**: Supabase client queries
- **After**: Mongoose ODM with MongoDB
- **Compatibility**: Same interface, different backend

## Troubleshooting

### Common Issues

1. **Connection Error**: Ensure MongoDB is running and connection string is correct
2. **Authentication Issues**: Verify JWT_SECRET is set in environment
3. **Permission Errors**: Check user roles and workspace membership

### Rollback Plan

If you need to rollback to Supabase:
1. Comment out MongoDB imports in `lib/store.ts`
2. Uncomment Supabase environment variables in `.env.local`
3. Revert API imports to use `supabaseApi`

## Production Deployment

1. **Set up MongoDB Atlas** (recommended for production)
2. **Update environment variables** with production MongoDB URI
3. **Change JWT_SECRET** to a secure random string
4. **Run migration/seeding** on production database
5. **Test thoroughly** before switching traffic

## Security Considerations

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days (configurable)
- Application-level permission checking replaces RLS
- MongoDB connection uses authentication and encryption

## Support

If you encounter issues:
1. Check MongoDB connection and logs
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Review the migration logs for specific errors
