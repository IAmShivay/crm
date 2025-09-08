# CRM API Documentation

## Overview

This document describes the REST API endpoints for the CRM system. All endpoints require authentication via Bearer token unless otherwise specified.

## Authentication

All API requests must include an Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
https://your-domain.com/api
```

## Response Format

All API responses follow this format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... } // Only for paginated endpoints
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors if applicable
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
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
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

#### POST /api/auth/signup
Register a new user and workspace.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "workspaceName": "My Company"
}
```

### Leads

#### GET /api/leads
Get leads with pagination and filtering.

**Query Parameters:**
- `workspaceId` (required): Workspace ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `assignedTo` (optional): Filter by assigned user
- `priority` (optional): Filter by priority (low, medium, high)
- `search` (optional): Search in name, email, company, phone
- `tags` (optional): Comma-separated tag IDs

**Response:**
```json
{
  "success": true,
  "leads": [
    {
      "id": "lead-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "status": "new",
      "statusId": "status-id",
      "source": "website",
      "value": 5000,
      "priority": "medium",
      "assignedTo": {
        "id": "user-id",
        "fullName": "Jane Smith"
      },
      "tagIds": [
        {
          "id": "tag-id",
          "name": "Hot Lead",
          "color": "#ff0000"
        }
      ],
      "nextFollowUpAt": "2024-01-20T10:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /api/leads
Create a new lead.

**Request Body:**
```json
{
  "workspaceId": "workspace-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "status": "new",
  "statusId": "status-id",
  "source": "website",
  "value": 5000,
  "priority": "medium",
  "assignedTo": "user-id",
  "tagIds": ["tag-id-1", "tag-id-2"],
  "notes": "Initial contact notes",
  "nextFollowUpAt": "2024-01-20T10:00:00Z",
  "customFields": {
    "industry": "Technology"
  }
}
```

### Lead Notes

#### GET /api/leads/{leadId}/notes
Get notes for a specific lead.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "note-id",
      "content": "Had a great call with the client",
      "type": "call",
      "isPrivate": false,
      "createdBy": {
        "id": "user-id",
        "fullName": "Jane Smith"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/leads/{leadId}/notes
Create a note for a lead.

**Request Body:**
```json
{
  "content": "Had a great call with the client",
  "type": "call",
  "isPrivate": false
}
```

### Tags

#### GET /api/tags
Get tags for a workspace.

**Query Parameters:**
- `workspaceId` (required): Workspace ID

**Response:**
```json
{
  "success": true,
  "tags": [
    {
      "id": "tag-id",
      "name": "Hot Lead",
      "color": "#ff0000",
      "description": "High priority leads",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/tags
Create a new tag.

**Request Body:**
```json
{
  "workspaceId": "workspace-id",
  "name": "Hot Lead",
  "color": "#ff0000",
  "description": "High priority leads"
}
```

#### PUT /api/tags/{tagId}
Update a tag.

#### DELETE /api/tags/{tagId}
Delete a tag.

### Lead Statuses

#### GET /api/lead-statuses
Get lead statuses for a workspace.

**Query Parameters:**
- `workspaceId` (required): Workspace ID

**Response:**
```json
{
  "success": true,
  "statuses": [
    {
      "id": "status-id",
      "name": "New",
      "color": "#3b82f6",
      "description": "Newly created leads",
      "order": 1,
      "isDefault": true,
      "isActive": true
    }
  ]
}
```

#### POST /api/lead-statuses
Create a new lead status.

**Request Body:**
```json
{
  "workspaceId": "workspace-id",
  "name": "New",
  "color": "#3b82f6",
  "description": "Newly created leads",
  "order": 1,
  "isDefault": true
}
```

### Webhooks

#### GET /api/webhooks
Get webhooks for a workspace.

**Query Parameters:**
- `workspaceId` (required): Workspace ID

#### POST /api/webhooks
Create a new webhook.

**Request Body:**
```json
{
  "workspaceId": "workspace-id",
  "name": "Lead Webhook",
  "description": "Webhook for receiving leads",
  "webhookType": "lead_capture",
  "events": ["lead.created", "lead.updated"],
  "headers": {
    "Content-Type": "application/json"
  },
  "transformationRules": {
    "name": "$.full_name",
    "email": "$.email_address"
  }
}
```

#### GET /api/webhooks/{webhookId}
Get webhook details.

#### PUT /api/webhooks/{webhookId}
Update a webhook.

#### DELETE /api/webhooks/{webhookId}
Delete a webhook.

### User Preferences

#### GET /api/users/preferences
Get user preferences.

#### PUT /api/users/preferences
Update user preferences.

#### PATCH /api/users/preferences
Partially update user preferences.

## Error Codes

- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `500` - Internal Server Error: Server error

## Rate Limiting

API requests are limited to 1000 requests per hour per user.

## Pagination

Paginated endpoints return pagination information:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```
