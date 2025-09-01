# CRM Developer Guide

## 🏗️ Architecture Overview

This CRM system is built with **Next.js 14**, **MongoDB**, and **TypeScript**. It follows a modern full-stack architecture with:

- **Frontend**: Next.js with App Router, React 18, TailwindCSS
- **Backend**: Next.js API Routes with MongoDB
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based custom auth system
- **State Management**: Redux Toolkit with RTK Query
- **UI Components**: Custom components with Radix UI primitives

## 📁 Project Structure

```
crm/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── roles/                # Role management
│   │   └── webhooks/             # External webhooks
│   ├── auth/                     # Auth pages (login, signup, etc.)
│   ├── dashboard/                # Main dashboard
│   └── globals.css               # Global styles
├── components/                   # React Components
│   ├── auth/                     # Authentication forms
│   ├── dashboard/                # Dashboard widgets
│   ├── leads/                    # Lead management
│   ├── providers/                # Context providers
│   ├── roles/                    # Role management
│   └── ui/                       # Reusable UI components
├── lib/                          # Core libraries
│   ├── api/                      # API layer (RTK Query)
│   ├── mongodb/                  # MongoDB models & connection
│   ├── slices/                   # Redux slices
│   └── utils.ts                  # Utility functions
├── scripts/                      # Database scripts
└── docs/                         # Documentation
```

## 🗄️ Database Schema

### Core Collections

#### Users
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  fullName?: string,
  avatarUrl?: string,
  timezone: string,
  preferences: object,
  emailConfirmed: boolean,
  emailConfirmedAt?: Date,
  lastSignInAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Workspaces
```typescript
{
  _id: ObjectId,
  name: string,
  slug: string (unique),
  planId: string,
  subscriptionStatus: string,
  dodoCustomerId?: string,
  dodoSubscriptionId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Leads
```typescript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  name: string,
  email?: string,
  phone?: string,
  company?: string,
  status: enum,
  source: string,
  value: number,
  assignedTo?: ObjectId,
  tags: string[],
  notes?: string,
  customFields: object,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Roles
```typescript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  name: string,
  description?: string,
  permissions: string[],
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication System

### JWT-Based Authentication
- **Login**: `/api/auth/login` - Returns JWT token
- **Signup**: `/api/auth/signup` - Creates user + workspace
- **Token Storage**: localStorage (client-side)
- **Token Verification**: Middleware in API routes

### Permission System
```typescript
// Permission format: "resource:action"
// Examples:
"leads:create"     // Can create leads
"leads:read"       // Can view leads
"users:*"          // All user actions
"*:*"              // All permissions (admin)
```

### Auth Flow
1. User submits credentials
2. Server validates against MongoDB
3. JWT token generated and returned
4. Token stored in localStorage
5. Token sent in Authorization header for API calls

## 🔌 API Layer

### RTK Query Setup
```typescript
// lib/api/mongoApi.ts
export const mongoApi = createApi({
  reducerPath: 'mongoApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Lead', 'Role', 'Workspace', 'Activity', 'User'],
  endpoints: (builder) => ({
    // Query and mutation definitions
  })
});
```

### Available Hooks
```typescript
// Leads
useGetLeadsQuery(workspaceId, { status?: string })
useCreateLeadMutation()
useUpdateLeadMutation()
useDeleteLeadMutation()

// Roles
useGetRolesQuery(workspaceId)
useCreateRoleMutation()

// Activities
useGetActivitiesQuery({ workspaceId, limit? })

// Workspaces
useGetUserWorkspacesQuery(userId)
```

## 🛠️ Development Workflow

### Getting Started
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Set up environment
cp .env.example .env.local
# Update MONGODB_URI in .env.local

# 3. Seed database
npm run db:seed

# 4. Start development
npm run dev
```

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:seed          # Seed MongoDB with initial data
npm run db:migrate       # Migrate from Supabase (if needed)
npm run docker:up        # Start MongoDB with Docker
npm run docker:down      # Stop MongoDB Docker containers
```

### Environment Variables
```env
# Required
MONGODB_URI=mongodb://connection-string
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Optional
DODO_API_KEY=payment-provider-key
NEXT_PUBLIC_DODO_PUBLIC_KEY=public-key
DODO_WEBHOOK_SECRET=webhook-secret
```

## 🧪 Testing

### Manual Testing
1. **Authentication**:
   - Login: `admin@crm.com` / `admin123`
   - Signup: Create new account with workspace

2. **Lead Management**:
   - Create, update, delete leads
   - Filter by status
   - Assign to users

3. **Role Management**:
   - View default roles
   - Create custom roles
   - Assign permissions

### Automated Testing (TODO)
```bash
# Future implementation
npm run test              # Run unit tests
npm run test:e2e          # Run end-to-end tests
npm run test:coverage     # Generate coverage report
```

## 🔧 Adding New Features

### 1. Adding a New Model
```typescript
// 1. Create model in lib/mongodb/models/NewModel.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface INewModel extends Document {
  _id: string;
  // ... your fields
}

const NewModelSchema = new Schema<INewModel>({
  // ... schema definition
});

export const NewModel = mongoose.model<INewModel>('NewModel', NewModelSchema);

// 2. Export from lib/mongodb/models/index.ts
export { NewModel, type INewModel } from './NewModel';

// 3. Add to client operations in lib/mongodb/client.ts
async createNewModel(data: Partial<INewModel>): Promise<INewModel> {
  const model = new NewModel(data);
  return await model.save();
}
```

### 2. Adding API Endpoints
```typescript
// 1. Add to RTK Query in lib/api/mongoApi.ts
getNewModels: builder.query<NewModel[], string>({
  queryFn: async (workspaceId) => {
    // Implementation
  },
  providesTags: ['NewModel'],
}),

// 2. Create API route in app/api/new-models/route.ts
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  // Implementation
}
```

### 3. Adding UI Components
```typescript
// 1. Create component in components/new-feature/
export function NewFeatureComponent() {
  const { data } = useGetNewModelsQuery(workspaceId);
  // Implementation
}

// 2. Add to appropriate page/layout
import { NewFeatureComponent } from '@/components/new-feature';
```

## 🚀 Deployment

### Production Checklist
- [ ] Update `JWT_SECRET` to secure random string
- [ ] Set up MongoDB Atlas or production MongoDB
- [ ] Update `MONGODB_URI` for production
- [ ] Configure payment provider keys
- [ ] Set up monitoring and logging
- [ ] Run database seeding on production

### Environment Setup
```bash
# Production build
npm run build
npm run start

# Or deploy to Vercel/Netlify
# Ensure environment variables are set in deployment platform
```

## 🔍 Debugging

### Common Issues

1. **MongoDB Connection Errors**
   ```bash
   # Check connection string
   echo $MONGODB_URI
   
   # Test connection
   mongosh "$MONGODB_URI"
   ```

2. **Authentication Issues**
   ```typescript
   // Check JWT token in browser localStorage
   localStorage.getItem('auth_token')
   
   // Verify token payload
   // Use jwt.io to decode token
   ```

3. **API Errors**
   ```bash
   # Check server logs
   npm run dev
   
   # Check network tab in browser DevTools
   # Look for 401/403 errors
   ```

### Development Tools
- **MongoDB Compass**: GUI for database inspection
- **Postman**: API testing
- **Redux DevTools**: State debugging
- **React DevTools**: Component debugging

## 📚 Key Libraries

### Core Dependencies
- **Next.js 14**: React framework with App Router
- **MongoDB/Mongoose**: Database and ODM
- **Redux Toolkit**: State management
- **RTK Query**: Data fetching and caching
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **React Hook Form**: Form handling
- **Zod**: Schema validation

### UI Components
- **Radix UI**: Accessible primitives
- **Lucide React**: Icons
- **React Hot Toast**: Notifications
- **Recharts**: Data visualization

## 🔄 Migration Notes

### From Supabase to MongoDB
- **Authentication**: Supabase Auth → JWT + bcrypt
- **Database**: PostgreSQL → MongoDB
- **Real-time**: Supabase subscriptions → (TODO: implement with Socket.io)
- **Storage**: Supabase Storage → (TODO: implement with cloud storage)

### Breaking Changes
- All API endpoints now require `Authorization: Bearer <token>` header
- User IDs are now MongoDB ObjectIds (string format)
- Date fields use camelCase (`createdAt` vs `created_at`)
- Relationships use string references instead of foreign keys

## 🎯 Roadmap

### Immediate TODOs
- [ ] Implement password reset functionality
- [ ] Add email verification system
- [ ] Implement real-time updates
- [ ] Add file upload/storage
- [ ] Create comprehensive test suite

### Future Enhancements
- [ ] Advanced analytics dashboard
- [ ] Email marketing integration
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Third-party integrations (CRM, email providers)

## 🤝 Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include JSDoc comments for complex functions
- Use consistent import ordering

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature
```

### Pull Request Guidelines
- Include description of changes
- Add screenshots for UI changes
- Ensure tests pass
- Update documentation if needed

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
