# CRM API Documentation

This directory contains comprehensive API documentation for the CRM system.

## Documentation Structure

### API Documentation
- [`api/leads-api.md`](./api/leads-api.md) - Complete Leads API documentation with examples

### Postman Collections
- [`postman/CRM-Leads-API.postman_collection.json`](./postman/CRM-Leads-API.postman_collection.json) - Postman collection for testing all API endpoints

## Quick Start

### 1. Import Postman Collection
1. Open Postman
2. Click "Import" button
3. Select the `CRM-Leads-API.postman_collection.json` file
4. The collection will be imported with all endpoints configured

### 2. Set Environment Variables
Before using the collection, set these variables in Postman:
- `base_url`: Your API base URL (e.g., `http://localhost:3000/api`)
- `workspace_id`: Your workspace ID
- `auth_token`: Your JWT authentication token

### 3. Authentication
All API endpoints require authentication. Include the Bearer token in the Authorization header:
```
Authorization: Bearer your-jwt-token
```

## API Endpoints Overview

### Leads Management
- **GET** `/api/leads` - Get paginated leads list
- **POST** `/api/leads` - Create new lead
- **PUT** `/api/leads/{id}` - Update existing lead
- **DELETE** `/api/leads/{id}` - Delete lead

### Lead Statuses
- **GET** `/api/lead-statuses` - Get all lead statuses
- **POST** `/api/lead-statuses` - Create new status
- **DELETE** `/api/lead-statuses/{id}` - Delete status

### Tags
- **GET** `/api/tags` - Get all tags
- **POST** `/api/tags` - Create new tag
- **DELETE** `/api/tags/{id}` - Delete tag

### Workspace Members
- **GET** `/api/workspaces/{id}/members` - Get workspace members

## Key Features

### Lead Management
- ✅ Full CRUD operations
- ✅ Pagination and search
- ✅ Status and tag assignment
- ✅ User assignment
- ✅ Field validation
- ✅ Populated responses (status, tags, assigned user details)

### Data Validation
- ✅ Zod schema validation
- ✅ Proper error messages
- ✅ Type safety
- ✅ Empty string handling

### Security
- ✅ JWT authentication
- ✅ Workspace access control
- ✅ Rate limiting
- ✅ Request logging

## Testing

### Using Postman
1. Import the collection
2. Set environment variables
3. Run individual requests or the entire collection
4. Check response formats and status codes

### Using cURL
See the API documentation for complete cURL examples for each endpoint.

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

All error responses include descriptive messages and, for validation errors, detailed field-level error information.

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": [ /* detailed error information */ ]
}
```

### Paginated Response
```json
{
  "success": true,
  "leads": [ /* array of leads */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Development Notes

### Field Population
The API automatically populates related fields:
- `statusId` returns full status object with name and color
- `tagIds` returns array of tag objects with name and color
- `assignedTo` returns user object with fullName and email

### Empty Values
- Empty strings are accepted for optional fields
- Use empty string `""` to clear a field value
- Use `"unassigned"` or empty string for assignedTo to unassign

### Workspace Context
All operations are scoped to a specific workspace. The `workspaceId` parameter is required for all endpoints and ensures data isolation between workspaces.

## Support

For questions or issues with the API:
1. Check the detailed API documentation
2. Verify your authentication token
3. Ensure proper workspace access
4. Check request format and required fields
5. Review error messages for specific guidance
