# ktrlplane

A cloud platform control plane for managing projects, resources, and RBAC with PostgreSQL backend and React frontend.

## Quick Start

See the [Getting Started Guide](docs/getting-started.md) for detailed setup instructions.

### Prerequisites

- Go 1.24+
- Node.js 18+
- PostgreSQL 14+
- pnpm

### Development Setup

```bash
# 1. Setup database and configuration
createdb ktrlplane_db
cp config.yaml.example config.yaml  # Edit with your settings

# 2. Run migrations
go run cmd/migrate/main.go

# 3. Start backend
go run cmd/server/main.go

# 4. Start frontend (in another terminal)
cd web
pnpm install
pnpm run dev
```



## Billing & Stripe Configuration

To enable billing and subscription management, set the following environment variables in your `config.yaml` or as environment variables:

```env
# Stripe API keys (test or live)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

These are required for billing features to function. See the [Billing Implementation Plan](docs/billing-implementation-plan.md) for more details.

## Documentation

- 📚 [Documentation](docs/) - Complete documentation
- 🚀 [Getting Started](docs/getting-started.md) - Quick setup guide
- 🛠️ [Development](docs/development.md) - Development workflow
- 🚢 [Deployment](docs/deployment.md) - Production deployment
- 📖 [API Reference](docs/api-reference.md) - REST API documentation

## Deployment

### Production (Helm)

```bash
helm repo add ktrlplane https://charts.ktrlplane.io
helm install ktrlplane ktrlplane/ktrlplane
```

### Development (Docker)

```bash
cd deployments/docker
docker-compose up -d
```

See [deployment examples](deployments/) for more options.

## Project Structure

```
├── cmd/                 # Application entry points
├── internal/            # Private application code
├── migrations/          # Database migrations
├── web/                 # React frontend
├── deployments/         # Deployment examples
└── docs/                # Documentation
```

## Contributing

We welcome contributions! Please see our [development guide](docs/development.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
