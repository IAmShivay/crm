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

## Webhooks

### POST /api/webhooks/leads/[workspaceId]
Webhook endpoint for external lead creation.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "source": "facebook_ads",
  "value": 5000,
  "custom_fields": {
    "campaign": "Q1 2024"
  }
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
