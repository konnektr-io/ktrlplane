# Docker Deployment Examples

Example Docker configurations for development and testing.

## Files

- `Dockerfile.backend` - Backend container image
- `Dockerfile.frontend` - Frontend container image with Nginx
- `nginx.conf` - Nginx configuration for frontend
- `docker-compose.yml` - Complete development environment

## Usage

### Development Environment

Start all services (backend, frontend, PostgreSQL):

```bash
docker-compose up -d
```

Access:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432

### Building Individual Images

```bash
# From project root
docker build -f deployments/docker/Dockerfile.backend -t ktrlplane/backend .
docker build -f deployments/docker/Dockerfile.frontend -t ktrlplane/frontend .
```

## Configuration

Update environment variables in `docker-compose.yml` as needed:

- Database credentials
- Auth0 settings
- API endpoints
