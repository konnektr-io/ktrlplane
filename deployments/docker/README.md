# ktrlplane Docker Setup

This directory contains Docker configurations for running ktrlplane in containers.

## Quick Start

1. **Using Docker Compose (Recommended)**:
   ```bash
   cd deployments/docker
   docker-compose up -d
   ```

2. **Using Environment Variables**:
   - Copy `.env.example` to `.env` and customize values
   - Run: `docker-compose --env-file ../../.env up -d`

## Configuration

The backend supports both environment variables and config files. Environment variables take precedence.

### Required Environment Variables

```bash
# Database
KTRLPLANE_DB_HOST=localhost
KTRLPLANE_DB_PORT=5432
KTRLPLANE_DB_USER=postgres
KTRLPLANE_DB_PASSWORD=password
KTRLPLANE_DB_NAME=ktrlplane

# Auth0
KTRLPLANE_AUTH0_DOMAIN=your-domain.auth0.com
KTRLPLANE_AUTH0_AUDIENCE=https://api.your-domain.com
```

### Optional Environment Variables

```bash
KTRLPLANE_SERVER_PORT=3001
KTRLPLANE_DB_SSL_MODE=disable
KTRLPLANE_AUTH0_CLIENT_ID=your-client-id
```

## Building Images

### Backend
```bash
docker build -f deployments/docker/Dockerfile.backend -t ktrlplane-backend .
```

### Frontend
```bash
docker build -f deployments/docker/Dockerfile.frontend -t ktrlplane-frontend .
```

## Development

For local development, you can override specific services:

```bash
# Run only the database
docker-compose up postgres

# Then run backend locally with:
# go run ./cmd/server/main.go
```

## Accessing Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432

## Troubleshooting

1. **Config file not found**: Use environment variables instead of config.yaml
2. **Database connection issues**: Ensure postgres service is healthy before backend starts
3. **Nginx config not found**: Make sure to build from repository root with correct context
