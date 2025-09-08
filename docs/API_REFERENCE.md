# API Reference

## Authentication

All API endpoints (except auth) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "timezone": "UTC"
  },
  "token": "jwt_token_here",
  "workspace": {
    "id": "workspace_id",
    "name": "My Workspace",
    "planId": "free"
  }
}
```

### POST /api/auth/signup
Create new user account with optional workspace.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "workspaceName": "My Company" // Optional
}
```

**Response:** Same as login

## Leads API

### GET /api/leads?workspaceId=xxx&status=new
Get leads for a workspace with optional status filter.

**Query Parameters:**
- `workspaceId` (required): Workspace ID
- `status` (optional): Filter by lead status

**Response:**
```json
[
  {
    "id": "lead_id",
    "workspaceId": "workspace_id",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "status": "new",
    "source": "website",
    "value": 5000,
    "assignedTo": "user_id",
    "tags": ["hot", "enterprise"],
    "notes": "Interested in enterprise plan",
    "customFields": {},
    "createdBy": "user_id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/leads
Create a new lead.

**Request Body:**
```json
{
  "workspaceId": "workspace_id",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "status": "new",
  "source": "website",
  "value": 5000,
  "notes": "Interested in enterprise plan"
}
```

### PUT /api/leads/[id]
Update an existing lead.

### DELETE /api/leads/[id]
Delete a lead.

## Roles API

### GET /api/roles?workspaceId=xxx
Get all roles for a workspace.

**Response:**
```json
[
  {
    "id": "role_id",
    "workspaceId": "workspace_id",
    "name": "Sales Manager",
    "description": "Manage leads and sales team",
    "permissions": [
      "leads:create",
      "leads:read",
      "leads:update",
      "leads:delete"
    ],
    "isDefault": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/roles
Create a new role.

**Request Body:**
```json
{
  "workspaceId": "workspace_id",
  "name": "Custom Role",
  "description": "Custom role description",
  "permissions": ["leads:read", "leads:update"]
}
```

## User Preferences

### GET /api/users/preferences
Get current user preferences including theme, notifications, and other settings.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "theme": {
      "mode": "dark",
      "primaryColor": "#3b82f6",
      "preset": "blue",
      "customTheme": {
        "colors": {
          "primary": "#3b82f6",
          "secondary": "#64748b"
        },
        "typography": {
          "fontFamily": "Inter",
          "fontSize": "medium"
        },
        "animations": true
      }
    },
    "notifications": {
      "email": true,
      "push": false,
      "leadUpdates": true
    },
    "timezone": "UTC",
    "language": "en"
  }
}
```

### PUT /api/users/preferences
Update user preferences (replaces all preferences).

**Request Body:**
```json
{
  "theme": {
    "mode": "dark",
    "primaryColor": "#3b82f6"
  },
  "notifications": {
    "email": true,
    "leadUpdates": true
  }
}
```

### PATCH /api/users/preferences
Partially update user preferences (merges with existing).

**Request Body:**
```json
{
  "theme": {
    "mode": "light"
  }
}
```

## Webhooks Management

### GET /api/webhooks?workspaceId=xxx
Get all webhooks for a workspace.

**Response:**
```json
{
  "success": true,
  "webhooks": [
    {
      "id": "webhook_id",
      "workspaceId": "workspace_id",
      "name": "Facebook Lead Ads",
      "description": "Receives leads from Facebook campaigns",
      "webhookUrl": "https://app.com/api/webhooks/receive/webhook_id",
      "isActive": true,
      "webhookType": "facebook_leads",
      "events": ["lead.created"],
      "totalRequests": 150,
      "successfulRequests": 145,
      "failedRequests": 5,
      "lastTriggered": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/webhooks
Create a new webhook.

**Request Body:**
```json
{
  "workspaceId": "workspace_id",
  "name": "Facebook Lead Ads",
  "description": "Receives leads from Facebook campaigns",
  "webhookType": "facebook_leads",
  "events": ["lead.created"],
  "retryConfig": {
    "maxRetries": 3,
    "retryDelay": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook created successfully",
  "webhook": {
    "id": "webhook_id",
    "webhookUrl": "https://app.com/api/webhooks/receive/webhook_id",
    "secret": "webhook_secret_key",
    "...": "other webhook properties"
  }
}
```

### GET /api/webhooks/[id]
Get webhook details including recent logs.

### PUT /api/webhooks/[id]
Update webhook configuration.

### DELETE /api/webhooks/[id]
Delete a webhook.

## Webhook Receivers

### POST /api/webhooks/receive/[id]
Receive webhook data from external sources.

**Supported Webhook Types:**
- `facebook_leads` - Facebook Lead Ads
- `google_forms` - Google Forms submissions
- `zapier` - Zapier integrations
- `mailchimp` - Mailchimp subscribers
- `hubspot` - HubSpot contacts
- `salesforce` - Salesforce leads
- `custom` - Custom webhook format

**Request Body (Custom format):**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "source": "website",
  "value": 5000,
  "custom_fields": {
    "campaign": "Q1 2024",
    "utm_source": "google"
  }
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "lead_id",
  "message": "Lead created successfully"
}
```

### POST /api/webhooks/dodo
Dodo payment provider webhook for subscription events.

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production:

```typescript
// Example with next-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Data Validation

All API endpoints use Mongoose schema validation. Common validation rules:

- **Email**: Must be valid email format
- **Required fields**: Cannot be null/undefined
- **String lengths**: Enforced via maxlength
- **Enums**: Restricted to predefined values
- **References**: Must exist in referenced collection

## Pagination

For large datasets, implement pagination:

```typescript
// Example pagination
const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
const skip = (page - 1) * limit;

const leads = await Lead.find(query)
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });

const total = await Lead.countDocuments(query);

return {
  data: leads,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

## Security Considerations

1. **Password Hashing**: bcrypt with 12 rounds
2. **JWT Tokens**: 7-day expiration (configurable)
3. **Input Validation**: Mongoose schemas + custom validation
4. **Authorization**: Permission-based access control
5. **CORS**: Configure for production domains
6. **Rate Limiting**: Implement for production
7. **SQL Injection**: Not applicable (NoSQL)
8. **XSS Protection**: Sanitize user inputs
