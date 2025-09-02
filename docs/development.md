# Development Guide

This guide covers local development setup and contributing to ktrlplane.

## Development Environment

### Prerequisites

- Go 1.24+
- Node.js 18+
- PostgreSQL 14+
- pnpm
- Git

### Setup

1. Clone the repository:

```bash
git clone https://github.com/konnektr-io/ktrlplane-backend.git
cd ktrlplane-backend
```

2. Install Go dependencies:

```bash
go mod tidy
```

3. Install frontend dependencies:

```bash
cd web
pnpm install
cd ..
```

4. Set up your database and run migrations (see [Getting Started](getting-started.md))

5. Start development servers:

```bash
# Terminal 1: Backend
go run cmd/server/main.go

# Terminal 2: Frontend
cd web && pnpm run dev
```

## Project Structure

```
├── cmd/                 # Application entry points
│   ├── migrate/         # Database migration tool
│   └── server/          # HTTP server
├── internal/            # Private application code
│   ├── api/             # HTTP handlers and routes
│   ├── auth/            # Authentication logic
│   ├── config/          # Configuration management
│   ├── db/              # Database layer
│   ├── models/          # Data models
│   └── service/         # Business logic
├── migrations/          # SQL migration files
├── web/                 # React frontend
├── deployments/         # Deployment examples
└── docs/                # Documentation
```

## Development Workflow

### Backend Development

- Follow Go best practices
- Add tests for new functionality
- Run tests: `go test ./...`
- Format code: `go fmt ./...`

### Frontend Development

- Use TypeScript
- Follow React best practices
- Add tests for components
- Run tests: `cd web && pnpm test`
- Lint code: `cd web && pnpm lint`

### Database Changes

1. Create migration files in `migrations/`
2. Use sequential numbering: `XXX_description.sql`
3. Test migrations on development database

## Testing

### Unit Tests

```bash
# Backend
go test ./...

# Frontend
cd web && pnpm test
```

### Integration Tests

```bash
# Start test environment
cd deployments/docker
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
go test -tags=integration ./...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style

- Backend: Follow Go conventions
- Frontend: Use Prettier and ESLint
- Commit messages: Use conventional commits

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add changeset entry if needed
4. Request review from maintainers
