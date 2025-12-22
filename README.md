# KtrlPlane

**The Control Plane for the Konnektr Platform**

KtrlPlane is a centralized management system for users, organizations, projects, resources, billing, and role-based access control (RBAC). It serves as the administrative backbone for the entire Konnektr ecosystem.

---

## 🌐 Try It Live

**See KtrlPlane in action:** [ktrlplane.konnektr.io](https://ktrlplane.konnektr.io?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)

Create an account and start managing your Konnektr projects and resources instantly.

---

## 📚 Documentation

**Full documentation is available at:** [docs.konnektr.io/docs/ktrlplane](https://docs.konnektr.io/docs/ktrlplane?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)

### Quick Links

- 🚀 [Quick Start Guide](https://docs.konnektr.io/docs/ktrlplane/getting-started/quick-start?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- 🧱 [Core Concepts](https://docs.konnektr.io/docs/ktrlplane/concepts/organizations?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- 📖 [API Reference](https://docs.konnektr.io/docs/ktrlplane/api/authentication?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- 🔐 [Access Control & RBAC](https://docs.konnektr.io/docs/ktrlplane/concepts/access-control?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- 💳 [Billing & Subscriptions](https://docs.konnektr.io/docs/ktrlplane/api/billing?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- 🏗️ [Self-Hosting Guide](https://docs.konnektr.io/docs/ktrlplane/self-hosting/installation?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- 🛠️ [Development Setup](https://docs.konnektr.io/docs/ktrlplane/development/setup?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)

---

## 🚀 Quick Start


---

## 🎯 What is KtrlPlane?

KtrlPlane is the **Control Plane** of the Konnektr Platform, providing:

- **User & Organization Management**: Multi-tenant architecture with organizations and projects
- **Resource Lifecycle Management**: Create and manage Konnektr resources (Graph, Assembler, Flow, Compass)
- **Role-Based Access Control (RBAC)**: Fine-grained permissions at organization, project, and resource levels
- **Billing Integration**: Stripe-powered subscription and usage-based billing
- **Observability**: Integrated logging and metrics through Loki/Mimir proxies
- **Service Account Support**: Machine-to-machine authentication for backend services
- **Kubernetes-Native**: Declarative deployments using db-query-operator

**Technology Stack:**
- **Backend**: Go 1.24+ with PostgreSQL
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Zustand
- **Authentication**: Auth0 integration
- **Payments**: Stripe
- **Deployment**: Kubernetes with db-query-operator

---

## 📦 Features

### Core Capabilities
- ✅ Multi-tenant organization and project management
- ✅ Resource provisioning for Konnektr products
- ✅ Hierarchical RBAC with built-in roles
- ✅ Stripe billing with subscription management
- ✅ Auth0 authentication and M2M service accounts
- ✅ Kubernetes secrets management
- ✅ Logging and metrics proxy endpoints
- ✅ RESTful API with comprehensive documentation

### Managed Resources
- **Konnektr.Graph** - Graph database and API layer
- **Konnektr.Assembler** - AI-powered digital twin builder
- **Konnektr.Flow** - Real-time data & event processing
- **Konnektr.Compass** - Navigation/discovery tool *(coming soon)*

---

## 💻 Development Setup

### Prerequisites

- Go 1.24+
- Node.js 18+
- PostgreSQL 14+
- pnpm

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/konnektr-io/ktrlplane.git
cd ktrlplane

# 2. Setup database
createdb ktrlplane_db

# 3. Configure application
cp config.yaml.example config.yaml
# Edit config.yaml with your database and Auth0 settings

# 4. Run migrations
go run cmd/migrate/main.go

# 5. Start backend
go run cmd/server/main.go

# 6. Start frontend (in another terminal)
cd web
pnpm install
pnpm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

For detailed setup instructions, see the [Development Guide](https://docs.konnektr.io/docs/ktrlplane/development/setup?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane).

---

## 🔐 Configuration

### Environment Variables

Key configuration options in `config.yaml` or environment variables:

#### Authentication (Required)
```yaml
auth0:
  domain: your-tenant.auth0.com
  audience: https://api.ktrlplane.io
```

#### Stripe Billing (Required for billing features)

```yaml
stripe:
  secret_key: sk_test_...
  publishable_key: pk_test_...
  webhook_secret: whsec_...
```

#### Kubernetes (Required for resource deployment)
```yaml
kubernetes:
  in_cluster: false  # Set to true when running in K8s
  kubeconfig: ~/.kube/config
```

See the [Self-Hosting Guide](https://docs.konnektr.io/docs/ktrlplane/self-hosting/installation?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane) for complete configuration details.

---

## 🚢 Deployment

### Docker Compose (Development)

```bash
cd deployments/docker
docker-compose up -d
```

### Kubernetes (Production)

KtrlPlane uses the **db-query-operator** for Kubernetes deployments, which queries the database for desired state.

```bash
# Apply manifests
kubectl apply -f deployments/kubernetes/manifests.yaml

# The operator will automatically:
# - Read resource configurations from PostgreSQL
# - Deploy resources to appropriate namespaces
# - Maintain desired state
```

See [Kubernetes Deployment Guide](deployments/kubernetes/README.md) for details.

### Helm Chart *(coming soon)*

```bash
helm repo add ktrlplane https://charts.ktrlplane.io
helm install ktrlplane ktrlplane/ktrlplane
```

---

## 📂 Project Structure

```
ktrlplane/
├── cmd/                    # Application entry points
│   ├── migrate/           # Database migration tool
│   └── server/            # Main API server
├── internal/              # Private application code
│   ├── api/              # HTTP handlers and routes
│   ├── auth/             # Auth0 integration
│   ├── config/           # Configuration management
│   ├── db/               # Database queries
│   ├── models/           # Data models
│   ├── service/          # Business logic
│   └── utils/            # Helper functions
├── migrations/            # SQL database migrations
├── web/                   # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── features/     # Feature-based modules
│       ├── lib/          # Utilities and API client
│       └── pages/        # Route pages
├── deployments/           # Deployment configurations
│   ├── docker/           # Docker Compose setup
│   └── kubernetes/       # K8s manifests
└── docs/                  # Documentation source (MDX)
```

---

## 🧪 Testing

```bash
# Run backend tests
go test ./...

# Run backend tests with coverage
go test -cover ./...

# Run frontend tests
cd web
pnpm test
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Write tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please read our [Development Guide](https://docs.konnektr.io/docs/ktrlplane/development/setup?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane) for coding standards and best practices.

---

## 📋 Scope

KtrlPlane is the **Control Plane only**. It manages:

✅ **In Scope:**
- User management and authentication
- RBAC and permissions
- Billing and subscriptions
- Resource lifecycle management
- Project and organization management

❌ **Out of Scope:**
- Internal business logic of products (Graph queries, Flow execution, Assembler AI processing)
- Direct database access to product databases
- Product-specific operations (these go through product APIs)

See [PLATFORM_SCOPE.md](.github/PLATFORM_SCOPE.md) for detailed boundaries.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Platform**: [ktrlplane.konnektr.io](https://ktrlplane.konnektr.io?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- **Documentation**: [docs.konnektr.io/docs/ktrlplane](https://docs.konnektr.io/docs/ktrlplane?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)
- **Issues**: [GitHub Issues](https://github.com/konnektr-io/ktrlplane/issues)
- **Discussions**: [GitHub Discussions](https://github.com/konnektr-io/ktrlplane/discussions)
- **Konnektr Platform**: [konnektr.io](https://konnektr.io?utm_source=github&utm_medium=readme&utm_campaign=ktrlplane)

---

**Built with ❤️ by the Konnektr team**
