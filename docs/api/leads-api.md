# Leads API Documentation

## Overview
The Leads API provides endpoints for managing leads within workspaces. All endpoints require authentication via Bearer token.

## Base URL
```
/api/leads
```

## Authentication
All requests must include an Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Leads
Retrieve a paginated list of leads for a workspace.

**Endpoint:** `GET /api/leads`

**Query Parameters:**
- `workspaceId` (required): The workspace ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 20)
- `status` (optional): Filter by lead status
- `search` (optional): Search term for lead name, email, or company

**Example Request:**
```http
GET /api/leads?workspaceId=workspace123&page=1&limit=20&search=john
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "leads": [
    {
      "id": "lead123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "status": "new",
      "statusId": {
        "id": "status123",
        "name": "New Lead",
        "color": "#3b82f6"
      },
      "source": "website",
      "value": 5000,
      "assignedTo": {
        "id": "user123",
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "tagIds": [
        {
          "id": "tag123",
          "name": "Hot Lead",
          "color": "#ef4444"
        }
      ],
      "notes": "Interested in premium package",
      "priority": "high",
      "workspaceId": "workspace123",
      "createdBy": "user123",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 2. Create Lead
Create a new lead in a workspace.

**Endpoint:** `POST /api/leads`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "source": "website",
  "value": 5000,
  "statusId": "status123",
  "tagIds": ["tag123", "tag456"],
  "assignedTo": "user123",
  "notes": "Interested in premium package",
  "workspaceId": "workspace123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "lead123",
    "name": "John Doe",
    "email": "john@example.com",
    // ... other lead fields
  }
}
```

### 3. Update Lead
Update an existing lead.

**Endpoint:** `PUT /api/leads/{id}`

**Query Parameters:**
- `workspaceId` (required): The workspace ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "source": "referral",
  "value": 7500,
  "statusId": "status456",
  "tagIds": ["tag123", "tag789"],
  "assignedTo": "user456",
  "notes": "Updated notes"
}
```

**Example Request:**
```http
PUT /api/leads/lead123?workspaceId=workspace123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "value": 7500,
  "statusId": "status456",
  "tagIds": ["tag123", "tag789"],
  "assignedTo": "user456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "lead": {
    "id": "lead123",
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    // ... other updated fields
  }
}
```

### 4. Delete Lead
Delete a lead from a workspace.

**Endpoint:** `DELETE /api/leads/{id}`

**Query Parameters:**
- `workspaceId` (required): The workspace ID

**Example Request:**
```http
DELETE /api/leads/lead123?workspaceId=workspace123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

## Field Validation

### Required Fields
- `name`: String, 1-100 characters
- `workspaceId`: String, valid MongoDB ObjectId (for creation)

### Optional Fields
- `email`: Valid email format, max 255 characters, or empty string
- `phone`: String, max 20 characters, or empty string
- `company`: String, max 100 characters, or empty string
- `source`: Enum: `manual`, `website`, `referral`, `social`, `email`, `phone`, `other`
- `value`: Number, 0-999,999,999
- `statusId`: Valid MongoDB ObjectId (24-character hex string) or empty string
- `tagIds`: Array of valid MongoDB ObjectIds, maximum 10 tags
- `assignedTo`: Valid MongoDB ObjectId (24-character hex string) or empty string
- `notes`: String, max 2000 characters, or empty string

### Security Validations
- All IDs must be valid MongoDB ObjectIds (24-character hexadecimal strings)
- `statusId` must belong to the same workspace
- All `tagIds` must belong to the same workspace
- `assignedTo` must be an active member of the workspace
- Maximum 10 tags per lead to prevent abuse
- String length limits to prevent DoS attacks

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["name"],
      "message": "Expected string, received number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Lead not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Rate Limiting
All endpoints are subject to rate limiting. If you exceed the rate limit, you'll receive a 429 status code:

```json
{
  "message": "Too many requests. Please try again later."
}
```

## Related Endpoints

### Lead Statuses API
- `GET /api/lead-statuses?workspaceId={workspaceId}` - Get all lead statuses
- `POST /api/lead-statuses?workspaceId={workspaceId}` - Create new lead status
- `DELETE /api/lead-statuses/{id}?workspaceId={workspaceId}` - Delete lead status

### Tags API
- `GET /api/tags?workspaceId={workspaceId}` - Get all tags
- `POST /api/tags?workspaceId={workspaceId}` - Create new tag
- `DELETE /api/tags/{id}?workspaceId={workspaceId}` - Delete tag

### Workspace Members API
- `GET /api/workspaces/{workspaceId}/members` - Get workspace members

## Usage Examples

### Complete Lead Management Flow

1. **Get available statuses and tags:**
```bash
# Get lead statuses
curl -X GET "http://localhost:3000/api/lead-statuses?workspaceId=workspace123" \
  -H "Authorization: Bearer your-jwt-token"

# Get tags
curl -X GET "http://localhost:3000/api/tags?workspaceId=workspace123" \
  -H "Authorization: Bearer your-jwt-token"

# Get workspace members
curl -X GET "http://localhost:3000/api/workspaces/workspace123/members" \
  -H "Authorization: Bearer your-jwt-token"
```

2. **Create a new lead:**
```bash
curl -X POST "http://localhost:3000/api/leads" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "value": 5000,
    "statusId": "status123",
    "tagIds": ["tag123"],
    "assignedTo": "user123",
    "workspaceId": "workspace123"
  }'
```

3. **Update the lead:**
```bash
curl -X PUT "http://localhost:3000/api/leads/lead123?workspaceId=workspace123" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "value": 7500,
    "statusId": "status456",
    "tagIds": ["tag123", "tag789"]
  }'
```

4. **Get updated leads list:**
```bash
curl -X GET "http://localhost:3000/api/leads?workspaceId=workspace123&page=1&limit=20" \
  -H "Authorization: Bearer your-jwt-token"
```

## Notes
- All timestamps are in ISO 8601 format (UTC)
- Empty strings are accepted for optional fields and will be stored as empty values
- The API automatically populates related fields (statusId, tagIds, assignedTo) with full object data
- Pagination is 1-based (first page is page=1)
- Search functionality works across name, email, and company fields
