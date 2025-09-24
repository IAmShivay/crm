# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server
npm run dev

# Build the application
npm run build

# Start production server
npm start

# Lint and format code
npm run lint

# Seed MongoDB database with initial data
npm run db:seed
```

## Project Architecture

### Tech Stack

- **Framework**: Next.js 13.5.1 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **State Management**: Redux Toolkit Query (RTK Query)
- **Authentication**: Custom JWT-based authentication
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Payments**: Dodo Payments integration

### Key Architecture Patterns

#### Database Layer

- **MongoDB Models**: Located in `lib/mongodb/models/`
- **Client Abstraction**: `lib/mongodb/client.ts` provides MongoDBClient class
- **Connection Management**: `lib/mongodb/connection.ts` handles MongoDB connections
- **Model Exports**: All models are centralized in `lib/mongodb/models/index.ts`

#### API Layer (RTK Query)

- **Primary API**: `lib/api/mongoApi.ts` - main CRUD operations
- **Specialized APIs**:
  - `lib/api/authApi.ts` - authentication endpoints
  - `lib/api/webhookApi.ts` - webhook management
  - `lib/api/userPreferencesApi.ts` - user settings
  - `lib/api/contactsApi.ts` - contact management
- **Store Configuration**: `lib/store.ts` combines all API slices

#### State Management Structure

```typescript
// Redux store structure
{
  auth: authSlice,           // User authentication state
  theme: themeSlice,         // UI theme and preferences
  workspace: workspaceSlice, // Current workspace context
  mongoApi: mongoApi.reducer,     // MongoDB operations cache
  userPreferencesApi: userPreferencesApi.reducer, // User settings cache
  webhookApi: webhookApi.reducer, // Webhook operations cache
  authApi: authApi.reducer,       // Auth operations cache
  contactsApi: contactsApi.reducer // Contact operations cache
}
```

#### Authentication & Security

- **JWT Implementation**: Custom JWT with jose library
- **Middleware**: `middleware.ts` handles auth verification, rate limiting, CORS, CSP
- **Protected Routes**: Dashboard pages require authentication
- **Rate Limiting**: Per-endpoint rate limits defined in middleware
- **Security Headers**: Comprehensive security headers set in middleware

#### Database Models & Relationships

Core entities and their relationships:

- **User**: Central user management with profile data
- **Workspace**: Multi-tenant workspaces with subscription management
- **WorkspaceMember**: User-workspace relationships with roles
- **Role**: Custom role definitions with permissions array
- **Lead**: Lead management with status tracking and activities
- **Activity**: Audit trail for all user actions
- **Webhook**: Webhook endpoints for external integrations
- **WebhookLog**: Request/response logging (auto-cleanup after 90 days)

#### Component Organization

- **UI Components**: `components/ui/` - Radix UI primitives
- **Feature Components**: `components/{feature}/` - Business logic components
- **Layout Components**: `components/layout/` - Header, Sidebar, layouts
- **Provider Components**: `components/providers/` - Context and state providers

#### App Router Structure

```
app/
├── (auth)/           # Authentication pages group
├── (dashboard)/      # Protected dashboard pages group
├── api/             # API route handlers
│   ├── auth/        # Authentication endpoints
│   ├── webhooks/    # Webhook management
│   ├── roles/       # Role management
│   └── ...          # Other API routes
└── globals.css      # Global styles
```

### Data Flow Patterns

#### Typical CRUD Operation Flow

1. Component calls RTK Query hook (e.g., `useGetLeadsQuery()`)
2. RTK Query checks cache, makes API request if needed
3. API route handler in `app/api/` validates request
4. MongoDB client method called from `lib/mongodb/client.ts`
5. Mongoose model operation executed
6. Response cached by RTK Query and returned to component

#### Authentication Flow

1. User submits credentials via auth form
2. `app/api/auth/login/route.ts` validates credentials
3. JWT token generated and set as HTTP-only cookie
4. Client-side auth state updated via `authSlice`
5. Middleware protects subsequent requests using JWT verification
6. User redirected to dashboard with workspace context

#### Webhook Processing Flow

1. External service sends POST to `/api/webhooks/receive/[id]`
2. Webhook middleware validates signature and rate limits
3. Processor in `lib/webhooks/processors/` transforms payload
4. Lead created via MongoDB client
5. Activity logged and webhook response logged
6. Real-time updates sent to dashboard if applicable

### Key Configuration Files

#### Next.js Configuration (`next.config.js`)

- ESLint disabled during builds for faster deployment
- Unoptimized images for static export compatibility
- Mongoose configured as external package for server components
- MongoDB optional dependencies handled in webpack config

#### TypeScript Configuration (`tsconfig.json`)

- Strict mode enabled
- Path mapping: `@/*` points to project root
- Includes Next.js plugin for enhanced TypeScript support

#### Middleware Configuration (`middleware.ts`)

- JWT verification using jose library
- Rate limiting with in-memory store
- CORS handling for cross-origin requests
- Security headers including CSP
- Protected routes: `/dashboard`, `/leads`, `/roles`, `/workspace`, `/settings`, `/analytics`, `/webhooks`

### Database Seeding

The `npm run db:seed` command creates:

- Admin user: `admin@crm.com` / `admin123`
- Default workspace with full permissions
- System roles: Owner, Admin, Manager, Sales Rep, Viewer
- Default plans: Free, Starter, Professional, Enterprise
- Sample data for development

### Environment Variables Required

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/crm_database

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Dodo Payments Integration
DODO_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Common Development Patterns

#### Adding New API Endpoints

1. Create route handler in `app/api/{feature}/route.ts`
2. Add RTK Query endpoint in appropriate API slice
3. Export hook from API slice for component usage
4. Add TypeScript interfaces for request/response types

#### Adding New MongoDB Models

1. Create model file in `lib/mongodb/models/`
2. Export from `lib/mongodb/models/index.ts`
3. Add client methods in `lib/mongodb/client.ts`
4. Update TypeScript interfaces

#### Adding New Protected Routes

1. Add route pattern to `PROTECTED_ROUTES` in `middleware.ts`
2. Ensure component uses authentication state
3. Add role-based permission checks if needed

#### Working with Webhooks

- Webhook processors are in `lib/webhooks/processors/`
- Each processor handles specific webhook types (Facebook, Google Forms, etc.)
- Generic processor handles unknown webhook formats
- All webhook logs are automatically cleaned up after 90 days

### Testing Notes

- Testing framework dependencies are installed but no test configuration exists
- Jest and Testing Library are available for setting up tests
- Supertest is available for API endpoint testing
- No existing test files or Jest configuration found

### Build and Deployment

- Uses static export configuration for hosting flexibility
- Images are unoptimized for static compatibility
- ESLint checks disabled during builds
- No specific deployment configuration found
