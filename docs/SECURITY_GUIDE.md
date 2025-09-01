# Security Guide

## 🔒 Security Best Practices Implementation

### Authentication & Authorization

#### JWT Token Security
```typescript
// Strong JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET, // Must be 256+ bits
  expiresIn: '7d', // Short expiration for security
  algorithm: 'HS256',
  issuer: 'crm-system',
  audience: 'crm-users'
};

// Token validation with additional checks
export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'crm-system',
      audience: 'crm-users'
    });
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

#### Password Security
- **Hashing**: bcrypt with 12 rounds (implemented)
- **Minimum Requirements**: 8+ characters, mixed case, numbers
- **Password Reset**: Secure token-based reset flow
- **Account Lockout**: After 5 failed attempts (TODO)

#### Session Management
- **Token Rotation**: Implement refresh tokens (TODO)
- **Secure Storage**: HttpOnly cookies for production
- **CSRF Protection**: SameSite cookie attributes

### Enhanced Model Security

#### Secure Model Registry System
The application now uses an enhanced model registry system that provides:

- **Runtime Error Prevention**: Prevents `mongoose.models` undefined errors
- **Server-Side Only Creation**: Models only created on server to prevent SSR issues
- **Schema Validation**: Automatic validation before model registration
- **Error Handling**: Comprehensive error handling with detailed logging
- **Type Safety**: Full TypeScript coverage with proper type guards

```typescript
// Enhanced model creation with security
import { createModelSafe, validateSchema } from '../model-registry';

// Validate schema before model creation
validateSchema(UserSchema, 'User');

// Create model safely with error handling
export const User = createModelSafe<IUser>('User', UserSchema);
```

#### Index Optimization
- **No Duplicate Indexes**: Removed conflicting index declarations
- **Performance Optimized**: Compound indexes for efficient queries
- **Sparse Indexes**: Optional fields use sparse indexing
- **Unique Constraints**: Proper unique field handling

### API Security

#### Input Validation
```typescript
// Mongoose schema validation (implemented)
const LeadSchema = new Schema({
  email: {
    type: String,
    validate: {
      validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: 'Invalid email format'
    }
  },
  phone: {
    type: String,
    validate: {
      validator: (phone: string) => /^\+?[\d\s\-\(\)]+$/.test(phone),
      message: 'Invalid phone format'
    }
  }
});
```

#### Rate Limiting (TODO - Recommended)
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
  message: 'Too many API requests',
});
```

#### CORS Configuration
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};
```

### Database Security

#### MongoDB Security
```typescript
// Connection with security options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin',
  ssl: process.env.NODE_ENV === 'production',
  sslValidate: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

#### Data Sanitization
```typescript
// Prevent NoSQL injection
import mongoSanitize from 'express-mongo-sanitize';

// In API routes
export async function POST(request: NextRequest) {
  const body = await request.json();
  const sanitizedBody = mongoSanitize.sanitize(body);
  // Use sanitizedBody for database operations
}
```

#### Sensitive Data Protection
```typescript
// User model with password exclusion
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// Query projection to exclude sensitive fields
const users = await User.find({}, '-password -__v');
```

### Environment Security

#### Environment Variables
```env
# Production environment template
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/crm?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-256-bit-secret-key-here
JWT_EXPIRES_IN=7d

# API Keys (never commit these)
DODO_API_KEY=your-dodo-api-key
DODO_WEBHOOK_SECRET=your-webhook-secret

# Security headers
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Security Headers
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}
```

### Webhook Security

#### Signature Verification
```typescript
// Dodo webhook verification (implemented)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

#### IP Whitelisting (TODO)
```typescript
const ALLOWED_WEBHOOK_IPS = [
  '192.168.1.0/24', // Dodo IPs
  '10.0.0.0/8',     // Internal IPs
];

function isIPAllowed(ip: string): boolean {
  return ALLOWED_WEBHOOK_IPS.some(range => {
    // IP range validation logic
    return ipRangeCheck(ip, range);
  });
}
```

### Logging & Monitoring

#### Security Event Logging
```typescript
// Security logger
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// Log security events
securityLogger.warn('Failed login attempt', {
  email: 'user@example.com',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date().toISOString()
});
```

#### Audit Trail
```typescript
// Activity logging (implemented in Activity model)
async function logActivity(userId: string, action: string, details: any) {
  await Activity.create({
    userId,
    action,
    details,
    ipAddress: getClientIP(),
    userAgent: getUserAgent(),
    timestamp: new Date()
  });
}
```

### Deployment Security

#### Production Checklist
- [ ] Use HTTPS/TLS certificates
- [ ] Set secure environment variables
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access logging

#### Docker Security (if using)
```dockerfile
# Use non-root user
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Security scanning
RUN npm audit --audit-level moderate
```

### Compliance & Privacy

#### GDPR Compliance
- **Data Minimization**: Only collect necessary data
- **Right to Erasure**: Implement user data deletion
- **Data Portability**: Export user data functionality
- **Consent Management**: Clear privacy policies

#### Data Retention
```typescript
// Automatic data cleanup (TODO)
const cleanupOldData = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Delete old activities
  await Activity.deleteMany({
    createdAt: { $lt: thirtyDaysAgo },
    action: { $in: ['login', 'logout'] }
  });
  
  // Archive old leads
  await Lead.updateMany(
    { updatedAt: { $lt: thirtyDaysAgo }, status: 'closed_lost' },
    { archived: true }
  );
};
```

### Security Testing

#### Automated Security Tests (TODO)
```typescript
// Example security tests
describe('Security Tests', () => {
  test('should reject requests without authentication', async () => {
    const response = await request(app)
      .get('/api/leads')
      .expect(401);
  });
  
  test('should sanitize SQL injection attempts', async () => {
    const maliciousPayload = { email: { $ne: null } };
    const response = await request(app)
      .post('/api/auth/login')
      .send(maliciousPayload)
      .expect(400);
  });
  
  test('should enforce rate limiting', async () => {
    // Make multiple requests rapidly
    const promises = Array(10).fill(0).map(() =>
      request(app).post('/api/auth/login').send({ email: 'test', password: 'test' })
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
  });
});
```

### Incident Response

#### Security Incident Playbook
1. **Detection**: Monitor logs and alerts
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threats and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

#### Emergency Contacts
- Security Team: security@company.com
- DevOps Team: devops@company.com
- Legal Team: legal@company.com

---

**Remember**: Security is an ongoing process, not a one-time implementation. Regularly review and update security measures.
