# CRM System - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication & Security](#authentication--security)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Development Guide](#development-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This is a modern CRM (Customer Relationship Management) system built with Next.js, TypeScript, MongoDB, and Redux Toolkit. The system provides comprehensive lead management, workspace collaboration, role-based access control, and secure authentication.

### Key Features
- ✅ **Lead Management** - Complete lead lifecycle management
- ✅ **Workspace Collaboration** - Multi-tenant workspace system
- ✅ **Role-Based Access Control** - Granular permissions system
- ✅ **Secure Authentication** - JWT-based auth with middleware protection
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Responsive Design** - Mobile-first UI/UX
- ✅ **API-First Architecture** - RESTful API design

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: JWT with edge-compatible middleware
- **UI Components**: Radix UI, Lucide Icons
- **Development**: ESLint, TypeScript, Hot Reload

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd crm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/crm_database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Optional: Webhook Configuration
DODO_API_KEY=your-dodo-api-key
NEXT_PUBLIC_DODO_PUBLIC_KEY=your-public-key
DODO_WEBHOOK_SECRET=your-webhook-secret
```

### Default Credentials
After seeding, you can login with:
```
Admin: admin@crm.com / Admin123!@#
Manager: manager@crm.com / Manager123!@#
Sales: sales@crm.com / Sales123!@#
Demo: demo@crm.com / Demo123!@#
```

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Login** - User submits credentials
2. **Validation** - Server validates and generates JWT
3. **Token Storage** - Client stores token in localStorage
4. **Route Protection** - Middleware validates token on protected routes
5. **Auto-Refresh** - Token validation on app initialization

### Security Features
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - bcrypt with 12 rounds
- ✅ **Route Protection** - Server-side middleware protection
- ✅ **OWASP Headers** - Security headers applied
- ✅ **Rate Limiting** - Brute force protection
- ✅ **Input Validation** - Comprehensive data validation
- ✅ **XSS Protection** - Content Security Policy
- ✅ **CSRF Protection** - Cross-site request forgery protection

### Protected Routes
- `/dashboard` - Main dashboard
- `/leads` - Lead management
- `/workspace` - Workspace settings
- `/settings` - User settings
- `/analytics` - Analytics dashboard
- `/webhooks` - Webhook management

---

## 🔌 API Reference

### Authentication Endpoints
```http
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/verify
POST /api/auth/logout
```

### Lead Management
```http
GET    /api/leads              # Get all leads
POST   /api/leads              # Create new lead
GET    /api/leads/[id]         # Get lead by ID
PUT    /api/leads/[id]         # Update lead
DELETE /api/leads/[id]         # Delete lead
```

### Workspace Management
```http
GET    /api/workspaces         # Get user workspaces
POST   /api/workspaces         # Create workspace
GET    /api/workspaces/[id]    # Get workspace details
PUT    /api/workspaces/[id]    # Update workspace
DELETE /api/workspaces/[id]    # Delete workspace
```

### User Management
```http
GET    /api/users              # Get workspace users
POST   /api/users              # Create user
GET    /api/users/[id]         # Get user details
PUT    /api/users/[id]         # Update user
DELETE /api/users/[id]         # Delete user
```

### Role Management
```http
GET    /api/roles              # Get workspace roles
POST   /api/roles              # Create role
PUT    /api/roles/[id]         # Update role
DELETE /api/roles/[id]         # Delete role
```

### Activity Tracking
```http
GET    /api/activities         # Get activities
POST   /api/activities         # Log activity
```

### Webhook Management
```http
GET    /api/webhooks           # Get webhooks
POST   /api/webhooks           # Create webhook
PUT    /api/webhooks/[id]      # Update webhook
DELETE /api/webhooks/[id]      # Delete webhook
GET    /api/webhooks/logs      # Get webhook logs
```

---

## 🗄️ Database Schema

### Core Collections

#### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  fullName: String,
  timezone: String,
  emailConfirmed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Workspaces
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  currency: String,
  timezone: String,
  planId: String,
  subscriptionStatus: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Leads
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  name: String,
  email: String,
  phone: String,
  company: String,
  status: String,
  value: Number,
  assignedTo: ObjectId,
  priority: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Roles
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  name: String,
  permissions: [String],
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Optimized Indexes
- **Users**: `{ email: 1 }` (unique), `{ lastSignInAt: -1 }`
- **Workspaces**: `{ slug: 1 }` (unique), `{ subscriptionStatus: 1, planId: 1 }`
- **Leads**: `{ workspaceId: 1, status: 1 }`, `{ workspaceId: 1, assignedTo: 1 }`
- **Roles**: `{ workspaceId: 1, name: 1 }` (unique)

---

## 💻 Development Guide

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── mongodb/          # Database models and connection
│   └── redux/            # Redux store and slices
├── middleware.ts         # Next.js middleware
└── docs/                 # Documentation
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:seed      # Seed database with test data
```

### Code Style Guidelines
- Use TypeScript for all files
- Follow ESLint configuration
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for complex functions
- Use meaningful variable and function names

---

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure production MongoDB URI
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure proper CORS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crm
JWT_SECRET=your-super-secure-production-secret
JWT_EXPIRES_IN=7d
```

### Deployment Platforms
- **Vercel** (Recommended) - Zero-config deployment
- **Netlify** - JAMstack deployment
- **Railway** - Full-stack deployment
- **Docker** - Containerized deployment

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot read properties of null"
**Cause**: Null reference in database queries
**Solution**: Check database seeding and ensure proper data relationships

#### "Duplicate key error"
**Cause**: Trying to create records with existing unique values
**Solution**: Clear test data with `npm run db:seed`

#### "JWT token invalid"
**Cause**: Expired or malformed token
**Solution**: Clear localStorage and login again

#### Build errors
**Cause**: TypeScript or dependency issues
**Solution**: Run `npm run lint` and fix reported issues

### Performance Optimization
- Use MongoDB indexes for frequent queries
- Implement pagination for large datasets
- Use React.memo for expensive components
- Optimize images and assets
- Enable compression in production

### Security Best Practices
- Never expose sensitive data in client-side code
- Validate all user inputs
- Use HTTPS in production
- Regularly update dependencies
- Monitor for security vulnerabilities
- Implement proper logging and monitoring

---

## 📞 Support

For issues and questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check the GitHub issues
4. Contact the development team

---

**Last Updated**: 2025-09-14
**Version**: 1.0.0
