# KtrlPlane Documentation

Welcome to the KtrlPlane documentation. This directory contains comprehensive guides for using, deploying, and developing KtrlPlane - the Control Plane for the Konnektr Platform.

## 📋 Essential Documents

**Start here for development:**
- [/.github/copilot-instructions.md](../.github/copilot-instructions.md) - GitHub Copilot development guidelines and instructions
- [/.github/DEVELOPMENT_PLAN.md](../.github/DEVELOPMENT_PLAN.md) - Complete development roadmap and progress tracking
- [/.github/PLATFORM_SCOPE.md](../.github/PLATFORM_SCOPE.md) - Application boundaries and scope definitions

## 📚 Documentation Structure

This documentation is organized into several sections:

### Getting Started
- [Quick Start Guide](getting-started/quick-start.mdx) - Get up and running in minutes
- [Creating Your First Project](getting-started/first-project.mdx) - Step-by-step project creation
- [Understanding Organizations](getting-started/organizations.mdx) - Learn about organizational structure

### User Guides
- [Resource Management](guides/resources.mdx) - Deploy and manage your resources
- [Organization Management](guides/organizations.mdx) - Create and configure organizations
- [Project Management](guides/projects.mdx) - Project lifecycle management
- [Billing & Subscriptions](guides/billing.mdx) - Payment and subscription management
- [Access Control](guides/access-control.mdx) - User permissions and role management

### API Reference
- [Authentication](api/authentication.mdx) - API authentication and tokens
- [Resources API](api/resources.mdx) - Resource management endpoints
- [Organizations API](api/organizations.mdx) - Organization management endpoints
- [Projects API](api/projects.mdx) - Project management endpoints
- [RBAC API](api/rbac.mdx) - Access control endpoints
- [Billing API](api/billing.mdx) - Billing and subscription endpoints

### Self-Hosting
- [Installation Guide](self-hosting/installation.mdx) - Deploy KtrlPlane in your environment
- [Configuration](self-hosting/configuration.mdx) - Environment and system configuration
- [Database Setup](self-hosting/database.mdx) - PostgreSQL configuration and migrations
- [Authentication Setup](self-hosting/authentication.mdx) - Auth0 integration
- [Deployment Strategies](self-hosting/deployment.mdx) - Production deployment options
- [Monitoring & Observability](self-hosting/monitoring.mdx) - Logging, metrics, and health checks

### Development
- [Development Setup](development/setup.mdx) - Local development environment
- [Architecture Overview](development/architecture.mdx) - System design and components
- [Contributing Guidelines](development/contributing.mdx) - How to contribute to the project
- [Testing Strategy](development/testing.mdx) - Running and writing tests
- [API Development](development/api.mdx) - Extending the API

## 📊 Current Development Status

**Phase 1: Enhanced Resource Management** (Current Priority)
- JSON schema-driven resource configuration
- Dynamic form generation with validation
- db-query-operator integration for deployments

See [DEVELOPMENT_PLAN.md](../.github/DEVELOPMENT_PLAN.md) for detailed progress and next steps.

## 🏗️ Documentation Format

All documentation uses MDX format with fumadocs structure:
- **MDX files** with proper frontmatter metadata
- **meta.json files** for navigation structure
- **Usage-focused content** in main sections
- **Self-hosting content** separated from user guides
- **Development content** for contributors

## Quick Links

- [Installation Guide](self-hosting/installation.mdx)
- [API Documentation](api/)
- [Development Setup](development/setup.mdx)
- [Contributing Guidelines](development/contributing.mdx)

## Need Help?

- Check the [FAQ](support/faq.mdx)
- Visit our [Community Forums](support/community.mdx)
- Submit issues on GitHub
- See [Troubleshooting Guide](support/troubleshooting.mdx)
