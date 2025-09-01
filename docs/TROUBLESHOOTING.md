# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### MongoDB Connection Issues

#### Error: "MongoNetworkError: failed to connect to server"
**Cause**: MongoDB server not running or incorrect connection string

**Solutions:**
1. **Check MongoDB is running:**
   ```bash
   # For local MongoDB
   mongosh mongodb://localhost:27017
   
   # For remote MongoDB
   mongosh "your-connection-string"
   ```

2. **Verify connection string format:**
   ```env
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/crm_database
   
   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # Remote MongoDB with auth
   MONGODB_URI=mongodb://username:password@host:port/database
   ```

3. **Check firewall/network access:**
   - Ensure MongoDB port (27017) is accessible
   - For Atlas: Add your IP to whitelist
   - For remote servers: Check security groups/firewall rules

#### Error: "Authentication failed"
**Cause**: Incorrect MongoDB credentials

**Solutions:**
1. **Verify credentials:**
   ```bash
   # Test connection with mongosh
   mongosh "mongodb://username:password@host:port/database"
   ```

2. **Check user permissions:**
   ```javascript
   // In MongoDB shell
   use crm_database
   db.runCommand({usersInfo: "username"})
   ```

### Authentication Issues

#### Error: "Invalid token" or "Authentication required"
**Cause**: JWT token expired or invalid

**Solutions:**
1. **Clear localStorage and re-login:**
   ```javascript
   // In browser console
   localStorage.removeItem('auth_token');
   localStorage.removeItem('user_data');
   localStorage.removeItem('current_workspace');
   ```

2. **Check JWT secret consistency:**
   ```env
   # Ensure JWT_SECRET is the same across restarts
   JWT_SECRET=your-consistent-secret-key
   ```

3. **Verify token format:**
   ```javascript
   // Token should be in format: "Bearer <jwt-token>"
   const token = localStorage.getItem('auth_token');
   console.log('Token:', token);
   ```

#### Error: "User not found" after login
**Cause**: User exists in localStorage but not in MongoDB

**Solutions:**
1. **Check user exists in database:**
   ```javascript
   // In MongoDB shell
   db.users.findOne({email: "user@example.com"})
   ```

2. **Re-seed database if needed:**
   ```bash
   npm run db:seed
   ```

### Build/Compilation Issues

#### Error: "Module not found" for MongoDB
**Cause**: MongoDB dependencies not properly configured

**Solutions:**
1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. **Check Next.js config:**
   ```javascript
   // next.config.js should include:
   experimental: {
     serverComponentsExternalPackages: ['mongoose'],
   }
   ```

#### TypeScript Errors
**Cause**: Type mismatches after migration

**Solutions:**
1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Check import paths:**
   ```typescript
   // Use correct imports
   import { mongoApi } from '@/lib/api/mongoApi';
   // Not: import { supabaseApi } from '@/lib/api/supabaseApi';
   ```

### Runtime Issues

#### Error: "Cannot read property 'id' of undefined"
**Cause**: Data structure differences between Supabase and MongoDB

**Solutions:**
1. **Check property names:**
   ```typescript
   // MongoDB uses camelCase
   lead.createdAt  // ✅ Correct
   lead.created_at // ❌ Wrong (Supabase format)
   ```

2. **Add null checks:**
   ```typescript
   // Always check for null/undefined
   if (!user) {
     toast.error('User not authenticated');
     return;
   }
   ```

#### Error: "Duplicate key error"
**Cause**: Trying to create records with existing unique values

**Solutions:**
1. **Check unique constraints:**
   ```javascript
   // In MongoDB shell
   db.users.getIndexes()
   ```

2. **Clear test data:**
   ```bash
   # Re-seed database
   npm run db:seed
   ```

#### Warning: "Duplicate schema index found"
**Cause**: Mongoose detects existing indexes in database that conflict with schema definitions

**Note**: These warnings are cosmetic and don't affect functionality. The application works properly.

**Solutions:**
1. **Ignore warnings**: The application functions correctly despite warnings
2. **Clean database indexes** (if needed):
   ```javascript
   // In MongoDB shell - CAUTION: This will drop all indexes
   db.users.dropIndexes()
   db.workspaces.dropIndexes()
   // Then restart the application to recreate optimized indexes
   ```

3. **Fresh database**: Use a clean database instance for production

### Performance Issues

#### Slow API Responses
**Cause**: Missing database indexes or inefficient queries

**Solutions:**
1. **Check query performance:**
   ```javascript
   // In MongoDB shell
   db.leads.find({workspaceId: "xxx"}).explain("executionStats")
   ```

2. **Add indexes for common queries:**
   ```javascript
   // Example indexes
   db.leads.createIndex({workspaceId: 1, status: 1})
   db.leads.createIndex({workspaceId: 1, createdAt: -1})
   ```

#### Memory Issues
**Cause**: Large result sets or memory leaks

**Solutions:**
1. **Implement pagination:**
   ```typescript
   const leads = await Lead.find(query)
     .skip((page - 1) * limit)
     .limit(limit)
     .sort({ createdAt: -1 });
   ```

2. **Use lean queries for read-only data:**
   ```typescript
   const leads = await Lead.find(query).lean();
   ```

## 🔧 Development Tools

### MongoDB Debugging
```bash
# Connect to MongoDB shell
mongosh "your-connection-string"

# Show databases
show dbs

# Use CRM database
use crm_database

# Show collections
show collections

# Query examples
db.users.find().pretty()
db.leads.find({workspaceId: "xxx"}).limit(5)
db.roles.aggregate([{$group: {_id: "$workspaceId", count: {$sum: 1}}}])
```

### API Testing
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"admin123"}'

# Test authenticated endpoint
curl -X GET http://localhost:3000/api/leads?workspaceId=xxx \
  -H "Authorization: Bearer your-jwt-token"
```

### Redux DevTools
1. Install Redux DevTools browser extension
2. Open browser DevTools
3. Navigate to Redux tab
4. Monitor state changes and actions

## 🚀 Performance Optimization

### Database Optimization
1. **Proper Indexing:**
   ```javascript
   // Add indexes for frequently queried fields
   db.leads.createIndex({workspaceId: 1, status: 1})
   db.activities.createIndex({workspaceId: 1, createdAt: -1})
   ```

2. **Query Optimization:**
   ```typescript
   // Use projection to limit returned fields
   const leads = await Lead.find(query, 'name email status createdAt');
   
   // Use lean() for read-only operations
   const leads = await Lead.find(query).lean();
   ```

3. **Connection Pooling:**
   ```typescript
   // MongoDB automatically handles connection pooling
   // Adjust in connection string if needed:
   // mongodb://host:port/db?maxPoolSize=10
   ```

### Frontend Optimization
1. **RTK Query Caching:**
   ```typescript
   // Leverage automatic caching
   const { data: leads } = useGetLeadsQuery(workspaceId, {
     pollingInterval: 30000, // Refresh every 30s
   });
   ```

2. **Component Optimization:**
   ```typescript
   // Use React.memo for expensive components
   export const ExpensiveComponent = React.memo(({ data }) => {
     // Component logic
   });
   ```

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env.local` to version control
- Use strong, random JWT secrets in production
- Rotate secrets regularly

### Database Security
- Use MongoDB authentication in production
- Enable SSL/TLS for connections
- Implement proper backup strategies
- Monitor for suspicious activity

### API Security
- Validate all inputs
- Implement rate limiting
- Use HTTPS in production
- Log security events

## 📊 Monitoring & Logging

### Application Monitoring
```typescript
// Add logging to critical operations
console.log('User login attempt:', { email, timestamp: new Date() });
console.error('Database error:', error);
```

### Database Monitoring
```javascript
// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })

// View slow operations
db.system.profile.find().sort({ts: -1}).limit(5)
```

### Error Tracking
Consider integrating error tracking services:
- Sentry
- LogRocket
- Bugsnag

## 🧪 Testing Strategies

### Unit Testing (TODO)
```typescript
// Example test structure
describe('Lead API', () => {
  test('should create lead', async () => {
    const leadData = { name: 'Test Lead', email: 'test@example.com' };
    const result = await createLead(leadData);
    expect(result.name).toBe('Test Lead');
  });
});
```

### Integration Testing (TODO)
```typescript
// Test API endpoints
describe('POST /api/leads', () => {
  test('should create lead with valid data', async () => {
    const response = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send(leadData);
    
    expect(response.status).toBe(201);
  });
});
```

### E2E Testing (TODO)
```typescript
// Test user workflows with Playwright/Cypress
test('user can create and manage leads', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@crm.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  // ... test workflow
});
```

## 🔄 Migration Notes

### From Supabase to MongoDB
- **Completed**: Authentication, core models, API layer
- **TODO**: Real-time subscriptions, file storage, advanced features

### Data Migration
If you have existing Supabase data:
```bash
npm run db:migrate
```

This will:
1. Export data from Supabase
2. Transform to MongoDB format
3. Import to MongoDB
4. Preserve relationships

## 📈 Scaling Considerations

### Database Scaling
- **Horizontal Scaling**: MongoDB sharding
- **Vertical Scaling**: Increase server resources
- **Read Replicas**: For read-heavy workloads
- **Caching**: Redis for frequently accessed data

### Application Scaling
- **Load Balancing**: Multiple Next.js instances
- **CDN**: Static asset delivery
- **Caching**: API response caching
- **Background Jobs**: Queue system for heavy operations

---

**Need more help?** Check the [Developer Guide](./DEVELOPER_GUIDE.md) or create an issue.
