# KtrlPlane - GitHub Copilot Instructions

## 🎯 Project Overview

KtrlPlane is the **Control Plane** of the Konnektr Platform - a centralized management system for users, organizations, projects, resources, billing, and RBAC. It serves as the administrative backbone for the entire Konnektr ecosystem.

**Technology Stack:**

- Backend: Go 1.24+ with PostgreSQL
- Frontend: React + TypeScript + Vite + shadcn/ui + Zustand + Axios
- Deployment: Kubernetes with db-query-operator
- Authentication: Auth0 integration

## 📋 Core Instructions for GitHub Copilot

### 1. Maintain These Instructions

**CRITICAL:** Always keep this file and `.github/DEVELOPMENT_PLAN.md` up to date:

- When user provides new instructions ("don't do this", "always do that"), immediately add them to this file
- When significant features are added or architectural decisions are made, update both files
- When user mentions "in the future we might add X", add it to the development plan roadmap but don't implement
- When user provides documentation links, summarize key points and add relevant instructions here

### 2. Scope Adherence

KtrlPlane is the **Control Plane** only. Always refer to `.github/PLATFORM_SCOPE.md` for boundaries:

- ✅ **In Scope:** User management, RBAC, billing, resource lifecycle management, project management
- ❌ **Out of Scope:** Internal business logic of products (Graph queries, Flow execution, Assembler AI processing, etc.)
- All interactions with other Konnektr products must be through APIs
- No direct knowledge of other product's databases or internal logic

**Updated Product Names:**

- Konnektr.Graph (formerly Konnektr.DigitalTwins) - Graph database and API layer
- Konnektr.Assembler - AI-powered digital twin builder
- Konnektr.Flow - Real-time data & event processing
- Konnektr.Compass - Future navigation/discovery tool

### 3. Architecture Principles

#### Backend (Go)

- Follow standard Go project structure in `/internal`
- Use clean architecture: handlers → services → models → database
- All database operations through the service layer
- Comprehensive error handling with structured logging
- Use dependency injection for testability

#### Frontend (React)

- Follow the folder structure defined in `web/FOLDER_STRUCTURE.md`
- Feature-based architecture with clear boundaries
- No barrel exports to avoid circular dependencies
- Use TypeScript strictly - no `any` types
- State management with Zustand stores per feature

#### Database

- PostgreSQL with proper migrations in `/migrations`
- All schema changes through numbered migration files
- Use GORM for ORM operations
- Maintain referential integrity and proper indexing

### 4. Development Workflow

#### Always Start With:

1. Check DEVELOPMENT_PLAN.md for current priorities
2. Understand the scope and architectural boundaries
3. Plan before implementing (use manage_todo_list for complex tasks)
4. Write tests for new functionality

#### Code Quality Standards:

- Go: Follow Go conventions, use `go fmt`, add comprehensive tests
- TypeScript: Use strict TypeScript, follow React best practices
- Database: Test migrations on development database first
- Documentation: Update relevant docs when making changes

#### API Development:

- RESTful APIs following existing patterns in `/internal/api`
- Proper HTTP status codes and error responses
- Authentication/authorization on all endpoints
- API documentation in `docs/api-reference.md`

### 5. Billing & Payment Integration

- Use Stripe for payment processing
- Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Resource-based billing model (not seat-based)
- Billing inheritance: projects can inherit from organization billing
- Remove Stripe branding in UI (use generic payment terminology)


### 6. UI/UX Guidelines

- Use shadcn/ui components consistently
- Always use the fragment shorthand syntax (`<></>`) instead of `React.Fragment` in all React code
- Implement proper loading states and error handling
- Mobile-responsive design
- Follow Konnektr Design System for consistency across platform
- Clear visual hierarchy and intuitive navigation

### 7. Security Requirements

- All APIs require JWT authentication from Auth0
- RBAC enforcement at organization, project, and resource levels
- Input validation on both client and server
- Secure handling of payment information
- No sensitive data in logs

### 8. Testing Strategy

- Unit tests for all services and utilities
- Integration tests for API endpoints
- Frontend component testing
- End-to-end testing for critical user flows
- Database migration testing

### 9. Documentation Standards

- Keep API documentation current in `docs/api-reference.md`
- Update deployment guides when adding new environment variables
- Maintain clear README files with setup instructions
- Document all configuration options

### 10. Resource Management & Forms

- Use specific Zod-validated forms for each resource type (not dynamic forms yet)
- Each product (Graph, Assembler, Flow, Compass) has its own form component
- Support dynamic tier generation for future tier customization
- Tier selection should support URL parameters for homepage integration

### 11. Catalog & Product Discovery Strategy

- Consider removing KtrlPlane CatalogPage in favor of main homepage
- Homepage should handle product discovery and redirect to resource creation
- Support authentication flow: homepage → login → project selection → resource creation
- URL pattern: `/projects/{projectId}/resources/create?resourceType={type}&tier={tier}`

### 12. Deployment & Infrastructure

- Uses db-query-operator for Kubernetes deployments
- Database-driven configuration (operator queries DB for desired state)
- Environment-specific configuration through config.yaml
- Health check endpoints for monitoring
- Proper logging and metrics collection

### 13. Instructions for Other Projects

When the user requests instructions for another project:

- Do NOT create these instructions in a file.
- Provide the instructions as text only.
- ALWAYS add these instructions to this copilot-instructions file for future reference.

## 🚫 What NOT to Do

- Do not implement business logic of other Konnektr products
- Do not create direct database connections between applications
- Do not use barrel exports (index.ts files for re-exports)
- Do not hardcode configuration values
- Do not expose internal implementation details in APIs
- Do not create separate user management systems
- Do not implement separate billing systems in other products
- Do not deploy infrastructure directly (use declarative requests to Control Plane)

## 📝 Change Log

When updating these instructions, add entries here:

- **2025-01-27**: Initial comprehensive instructions created
- **2025-09-25**: Updated product names (DigitalTwins → Graph, added Assembler/Flow/Compass), added catalog strategy and dynamic forms guidance
- **[Future Date]**: [Description of changes made]

---

**Remember:** This file is the source of truth for development guidelines. Keep it updated with every significant instruction or architectural decision.
