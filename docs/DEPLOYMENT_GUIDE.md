# Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment Security Checklist

- [ ] **Environment Variables**
  - [ ] Generate secure JWT_SECRET (256+ bits)
  - [ ] Set strong database passwords
  - [ ] Configure production API keys
  - [ ] Set ALLOWED_ORIGINS for CORS
  - [ ] Enable FORCE_HTTPS=true

- [ ] **Database Security**
  - [ ] Enable MongoDB authentication
  - [ ] Configure SSL/TLS for database connections
  - [ ] Set up database backups
  - [ ] Configure connection pooling
  - [ ] Enable audit logging

- [ ] **Application Security**
  - [ ] Enable rate limiting
  - [ ] Configure security headers
  - [ ] Set up HTTPS certificates
  - [ ] Enable HSTS headers
  - [ ] Configure CSP headers

### Deployment Options

## Option 1: Vercel Deployment (Recommended)

### 1. Prepare for Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Configure Environment Variables
```bash
# Set production environment variables in Vercel dashboard
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add DODO_API_KEY
# ... add all required environment variables
```

### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Or use GitHub integration for automatic deployments
```

### 4. Configure Custom Domain
```bash
# Add custom domain
vercel domains add yourcrm.com
vercel alias set your-deployment-url.vercel.app yourcrm.com
```

## Option 2: Docker Deployment

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:7
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  mongodb_data:
  redis_data:
```

### 3. Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale the application
docker-compose up -d --scale app=3
```

## Option 3: AWS Deployment

### 1. AWS ECS with Fargate
```bash
# Install AWS CLI and configure
aws configure

# Create ECR repository
aws ecr create-repository --repository-name crm-app

# Build and push Docker image
docker build -t crm-app .
docker tag crm-app:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-app:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-app:latest
```

### 2. Create ECS Task Definition
```json
{
  "family": "crm-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "crm-app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:crm/mongodb-uri"
        }
      ]
    }
  ]
}
```

## Database Setup

### MongoDB Atlas (Recommended)
1. Create MongoDB Atlas account
2. Create new cluster
3. Configure network access (whitelist IPs)
4. Create database user
5. Get connection string
6. Configure environment variables

### Self-Hosted MongoDB
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongo
> use admin
> db.createUser({user: "admin", pwd: "securepassword", roles: ["root"]})
> exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled

sudo systemctl restart mongod
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourcrm.com -d www.yourcrm.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourcrm.com www.yourcrm.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourcrm.com www.yourcrm.com;

    ssl_certificate /etc/letsencrypt/live/yourcrm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourcrm.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'crm-app',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Log Management
```bash
# Install log rotation
sudo apt install logrotate

# Configure log rotation
sudo nano /etc/logrotate.d/crm-app
```

## Backup Strategy

### Database Backups
```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="crm_production"

mkdir -p $BACKUP_DIR

# Create backup
mongodump --uri="$MONGODB_URI" --db=$DB_NAME --out=$BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/$DATE.tar.gz s3://your-backup-bucket/mongodb/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE.tar.gz"
```

### Automated Backups
```bash
# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup-mongodb.sh
```

## Health Checks

### Application Health Check
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connection';

export async function GET() {
  try {
    // Check database connection
    await connectToDatabase();
    
    // Check external services
    const checks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
```

## Post-Deployment Verification

### 1. Functional Tests
```bash
# Test authentication
curl -X POST https://yourcrm.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"admin123"}'

# Test API endpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://yourcrm.com/api/leads?workspaceId=$WORKSPACE_ID
```

### 2. Security Tests
```bash
# Test HTTPS redirect
curl -I http://yourcrm.com

# Test security headers
curl -I https://yourcrm.com

# Test rate limiting
for i in {1..10}; do curl https://yourcrm.com/api/auth/login; done
```

### 3. Performance Tests
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Load test
ab -n 1000 -c 10 https://yourcrm.com/
```

## Rollback Strategy

### Quick Rollback
```bash
# With Vercel
vercel rollback

# With Docker
docker-compose down
docker-compose up -d --scale app=0
# Deploy previous version
docker-compose up -d
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --db=crm_production /path/to/backup
```

---

**Remember**: Always test deployments in a staging environment first!
