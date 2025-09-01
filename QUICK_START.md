# 🚀 Quick Start Guide

## Get Your CRM Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB (local or Atlas account)
- Git

### 1. Clone and Install
```bash
cd crm
npm install --legacy-peer-deps
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your MongoDB connection
# Minimum required:
MONGODB_URI=mongodb://localhost:27017/crm_development
JWT_SECRET=your-super-secure-256-bit-secret-key-here
```

### 3. Database Setup
```bash
# Seed database with admin user and default data
npm run db:seed
```

This creates:
- Admin user: `admin@crm.com` / `admin123`
- Default workspace: "Admin Workspace"
- 4 subscription plans
- Default roles with permissions

### 4. Start Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login and Explore
1. **Login**: Use `admin@crm.com` / `admin123`
2. **Dashboard**: View analytics and recent activity
3. **Leads**: Create and manage customer leads
4. **Roles**: Set up team permissions
5. **Settings**: Configure workspace settings

## 🧪 Test the APIs

### Import Postman Collection
1. Open Postman
2. Import `docs/CRM_API_Collection.postman_collection.json`
3. Set base_url to `http://localhost:3000`
4. Run "Login" request to get auth token
5. Test other endpoints

### Manual API Testing
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"admin123"}'

# Get leads (replace TOKEN with response from login)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/leads?workspaceId=WORKSPACE_ID"
```

## 🔧 Common Issues

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongosh mongodb://localhost:27017

# Or use MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crm
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Authentication Issues
```bash
# Clear browser storage
# In browser console:
localStorage.clear()
```

## 📚 Next Steps

1. **Read Documentation**: Check `docs/` folder for detailed guides
2. **Customize**: Modify components and add features
3. **Deploy**: Use deployment guide for production
4. **Security**: Review security guide for production setup

## 🆘 Need Help?

- 📖 [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- 🔧 [Troubleshooting](./docs/TROUBLESHOOTING.md)
- 🚀 [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- 🔒 [Security Guide](./docs/SECURITY_GUIDE.md)

**Happy coding! 🎉**
