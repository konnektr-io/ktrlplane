# API Reference

ktrlplane provides a RESTful API for managing projects, resources, and access control.

## Base URL

```
https://api.ktrlplane.example.com/api/v1
```

## Authentication

All API requests require authentication using JWT tokens from Auth0.

```http
Authorization: Bearer <jwt-token>
```

## Projects

### List Projects

```http
GET /projects
```

**Response:**

```json
{
  "projects": [
    {
      "project_id": "uuid",
      "name": "My Project",
      "description": "Project description",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Create Project

```http
POST /projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description"
}
```

### Get Project

```http
GET /projects/{projectId}
```

### Update Project

```http
PUT /projects/{projectId}
Content-Type: application/json

{
  "name": "Updated Project",
  "description": "Updated description"
}
```

### Delete Project

```http
DELETE /projects/{projectId}
```

## Resources

### List Resources

```http
GET /projects/{projectId}/resources
```

### Create Resource

```http
POST /projects/{projectId}/resources
Content-Type: application/json

{
  "name": "My Resource",
  "type": "Konnektr.DigitalTwins",
  "settings_json": {}
}
```

### Get Resource

```http
GET /projects/{projectId}/resources/{resourceId}
```

### Update Resource

```http
PUT /projects/{projectId}/resources/{resourceId}
Content-Type: application/json

{
  "name": "Updated Resource",
  "settings_json": {}
}
```

### Delete Resource

```http
DELETE /projects/{projectId}/resources/{resourceId}
```

## Access Control (RBAC)

### List Role Assignments

```http
GET /organizations/{orgId}/rbac
GET /projects/{projectId}/rbac
GET /projects/{projectId}/resources/{resourceId}/rbac
```

### Grant Access

```http
POST /organizations/{orgId}/rbac
Content-Type: application/json

{
  "user_id": "auth0|user123",
  "role_name": "admin",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

### Remove Access

```http
DELETE /rbac/{assignmentId}
```

## Organizations

### List Organizations

```http
GET /organizations
```

### Create Organization

```http
POST /organizations
Content-Type: application/json

{
  "name": "My Organization",
  "description": "Organization description"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "error": "validation_failed",
  "message": "Invalid request data",
  "details": {
    "field": "name",
    "issue": "required"
  }
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to 1000 requests per hour per user.

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

```http
GET /projects?limit=50&offset=0
```

**Response:**

```json
{
  "projects": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150,
    "has_more": true
  }
}
```
