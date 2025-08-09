# ktrlplane

A cloud platform control plane for managing projects, resources, and RBAC with PostgreSQL backend and React frontend.

## Project Structure

- `cmd/server/` - Go backend HTTP server
- `cmd/migrate/` - Database migration tool
- `internal/` - Go backend internal packages
- `web/` - React frontend application
- `migrations/` - SQL migration files

## Quick Start

### Prerequisites

- Go 1.23+
- Node.js 18+
- PostgreSQL 14+
- pnpm (for frontend)

### Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE ktrlplane_db;
```

2. Update `config.yaml` with your database connection details

3. Run migrations:

```bash
go run cmd/migrate/main.go
```

### Backend Setup

1. Install dependencies:

```bash
go mod tidy
```

2. Start the server:

```bash
go run cmd/server/main.go
```

The API will be available at http://localhost:8080

### Frontend Setup

1. Navigate to the web directory:

```bash
cd web
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm run dev
```

The frontend will be available at http://localhost:5173 (or next available port)

## API Endpoints

### Projects

- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Resources

- `GET /api/v1/projects/:projectId/resources` - List resources
- `POST /api/v1/projects/:projectId/resources` - Create resource
- `GET /api/v1/projects/:projectId/resources/:id` - Get resource
- `PUT /api/v1/projects/:projectId/resources/:id` - Update resource
- `DELETE /api/v1/projects/:projectId/resources/:id` - Delete resource

## Current Status

✅ Basic project structure  
✅ Database schema and migrations  
✅ CRUD operations for projects and resources  
✅ React frontend with routing  
✅ Basic UI components

🚧 Authentication (Auth0 integration)  
🚧 RBAC implementation  
🚧 Frontend forms and data management  
🚧 Resource type definitions  
🚧 Integration with db-query-operator

## Development Notes

- Authentication is currently mocked for development
- The frontend uses mock data and simplified routing
- Database uses regular PostgreSQL (not Apache AGE as originally planned)
- Integration with db-query-operator is planned for resource deployment

## Next Steps

See the continuation plan in the development documentation for next implementation phases.
