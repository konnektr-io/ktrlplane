# Getting Started

This guide will help you get ktrlplane up and running quickly.

## Prerequisites

- Go 1.24+
- Node.js 18+
- PostgreSQL 14+
- pnpm

## Quick Setup

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE ktrlplane_db;
```

### 2. Configuration

Update `config.yaml` with your database connection details and Auth0 configuration.

### 3. Run Migrations

```bash
go run cmd/migrate/main.go
```

### 4. Start Backend

```bash
go run cmd/server/main.go
```

The API will be available at http://localhost:8080

### 5. Start Frontend

```bash
cd web
pnpm install
pnpm run dev
```

The frontend will be available at http://localhost:5173

## What's Next?

- [Configure authentication](deployment.md#authentication)
- [Set up your first project](user-guide.md#projects)
- [Explore the API](api-reference.md)

## Need Help?

See the [troubleshooting guide](troubleshooting.md) or check our [FAQ](faq.md).
