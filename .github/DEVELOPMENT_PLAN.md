# KtrlPlane Development Plan & Progress

## 🎯 Mission Statement

KtrlPlane serves as the **Control Plane** for the Konnektr Platform - managing users, organizations, projects, resources, billing, and RBAC. It provides the central dashboard and API that all other Konnektr products depend on.

## 📊 Current Status

### ✅ Completed Infrastructure

- [x] Go backend with PostgreSQL database
- [x] React frontend with shadcn/ui
- [x] Authentication system (Auth0 integration)
- [x] Basic CRUD operations for organizations, projects, resources
- [x] RBAC system implementation
- [x] Billing service with Stripe integration
- [x] Database migrations and schema
- [x] API endpoints and handlers
- [x] Basic frontend UI components

### 🔄 In Progress

- [ ] Enhanced resource management with dynamic schemas
- [ ] Billing inheritance and workflow improvements
- [ ] UI/UX polish and consistency

### 📋 Backlog

- [ ] Advanced observability and monitoring
- [ ] Performance optimization
- [ ] Advanced billing features

## 🏗️ Architecture Overview

### Key Insight: db-query-operator Simplification

We use the [db-query-operator](https://github.com/konnektr-io/db-query-operator) for deployment management. This dramatically simplifies our approach:

1. **Store user settings** in the existing `settings_json` column
2. **db-query-operator** queries our database and deploys resources
3. **No complex infrastructure management** needed in KtrlPlane
4. **Focus on UI and user experience**

### Technology Stack

- **Backend**: Go 1.24+ with Gin framework
- **Database**: PostgreSQL 14+ with GORM
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Zustand
- **Authentication**: Auth0
- **Payments**: Stripe
- **Deployment**: Kubernetes with db-query-operator

## 🎯 Phase 1: Enhanced Resource Management (Current Priority)

**Goal**: Create flexible resource management with JSON schema-driven forms

### Week 1: Schema Foundation ✅ READY TO START

#### Frontend Schema System

- [ ] **Create Zod schemas for resource types** `web/src/lib/resourceSchemas.ts`

  - Konnektr.Graph schema (instances, memory, storage, sinks, event routes) - renamed from DigitalTwins
  - Konnektr.Flow schema (replicas, resources, environment variables)
  - Konnektr.Assembler schema (AI-powered digital twin builder configuration)
  - Konnektr.Compass schema (future navigation/discovery tool)
  - Shared validation utilities

- [ ] **Set up dynamic form generation** `web/src/components/forms/`
  - `DynamicResourceForm.tsx` component
  - Integration with react-hook-form + @hookform/resolvers/zod
  - Real-time validation and error display

#### Backend Schema Validation

- [ ] **Add server-side validation** `internal/api/handlers.go`
  - Validate resource settings against schemas
  - Return structured validation errors
  - Ensure consistency between frontend and backend validation

### Week 2: Resource Configuration UI

#### Konnektr.Graph Configuration (formerly DigitalTwins)

- [ ] **Build Graph settings page** `web/src/features/resources/components/GraphSettings.tsx`
  - Instance configuration (CPU, memory, storage)
  - Sink configuration for data outputs
  - Event route management

#### Konnektr.Assembler Configuration

- [ ] **Build Assembler settings page** `web/src/features/resources/components/AssemblerSettings.tsx`
  - AI model configuration
  - Data source connections
  - DTDL model generation settings

#### Konnektr.Flow Configuration

- [ ] **Build Flow settings page** `web/src/features/resources/components/FlowSettings.tsx`
  - Replica and scaling settings
  - Resource limits configuration
  - Environment variable management
  - Real-time event processing configuration

#### Form Enhancements

- [ ] **Add preset configurations** `web/src/lib/resourcePresets.ts`
  - Development, staging, production presets
  - Template library for common configurations
  - Easy configuration import/export

### Week 3: db-query-operator Integration

#### Database Query Resources

- [ ] **Create DatabaseQueryResource CRs** `deployments/kubernetes/db-query-operator/`
  - CRD definitions for each resource type
  - Query templates for resources table
  - Status update mechanisms

#### Deployment Templates

- [ ] **Create Git repository for templates** (separate repo or folder)
  - Helm charts for Konnektr.Graph (formerly DigitalTwins)
  - Kustomize templates for Konnektr.Flow
  - Templates for Konnektr.Assembler and Konnektr.Compass (future)
  - Template versioning and management

#### Operator Setup

- [ ] **Deploy and configure db-query-operator**
  - Install operator in Kubernetes cluster
  - Configure database connection
  - Test end-to-end deployment flow

### Week 4: Status & Polish

#### Optional Status Integration

- [ ] **Add deployment status polling** (if needed)
  - Kubernetes API integration for status
  - Real-time status updates in UI
  - Error handling and retry logic

#### Error Handling & UX

- [ ] **Comprehensive error handling**
  - User-friendly error messages
  - Validation feedback and guidance
  - Loading states and progress indicators

#### Testing & Documentation

- [ ] **End-to-end testing**

  - Resource creation flow testing
  - Form validation testing
  - db-query-operator integration testing

- [ ] **Documentation**
  - User guides for resource management
  - API documentation updates
  - Deployment guide updates

## 🎯 Phase 2: Billing Integration Enhancement (Weeks 5-8)

### Current Billing Status

✅ **Completed**: Stripe integration, billing service, subscription management
🔄 **Needs Work**: Billing inheritance, UI polish, workflow optimization

### Week 5: Billing Inheritance & Workflows

#### Project Billing Logic

- [ ] **Smart billing resolution**
  - Automatic inheritance from organization
  - Permission-aware billing access
  - Clear billing scope indicators

#### Resource-Based Billing

- [ ] **Auto-billing for resources**
  - Automatic subscription item creation
  - Usage tracking preparation
  - Cost optimization recommendations

#### UI Improvements

- [ ] **Remove Stripe branding**
  - Generic payment terminology
  - Consistent design language
  - Improved user experience

### Week 6: Usage Tracking Foundation

- [ ] **Usage metrics collection system**
- [ ] **Usage aggregation and reporting**
- [ ] **Cost calculation engine**
- [ ] **Usage-based billing triggers**

### Week 7: Advanced Billing Features

- [ ] **Billing dashboard with analytics**
- [ ] **Subscription management interface**
- [ ] **Payment method management**
- [ ] **Cost optimization tools**

### Week 8: Testing & Security

- [ ] **Comprehensive payment flow testing**
- [ ] **Security audit of payment handling**
- [ ] **Performance optimization**
- [ ] **Monitoring and alerting**

## 🎯 Phase 3: Observability & Monitoring (Weeks 9-12)

### Week 9: Logging Foundation

- [ ] **Structured logging across all services**
- [ ] **Log aggregation and storage**
- [ ] **Log analysis and search capabilities**
- [ ] **Audit logging for security events**

### Week 10: Metrics Collection

- [ ] **Metrics collection infrastructure**
- [ ] **Business and technical metric definitions**
- [ ] **Real-time metrics dashboards**
- [ ] **Automated alerting rules**

### Week 11: Tracing Implementation

- [ ] **Distributed tracing for all endpoints**
- [ ] **Trace analysis and visualization**
- [ ] **Performance monitoring dashboards**
- [ ] **Service dependency mapping**

### Week 12: Integration & Optimization

- [ ] **End-to-end observability integration**
- [ ] **Performance tuning and optimization**
- [ ] **Documentation and runbooks**
- [ ] **Team training and knowledge transfer**

## 🚀 Future Roadmap (Beyond Phase 3)

### Advanced Features (Months 4-6)

- [ ] **Multi-tenancy enhancements**
- [ ] **Advanced RBAC features**
- [ ] **Audit trail and compliance**
- [ ] **API rate limiting and quotas**
- [ ] **Advanced analytics and reporting**

### Platform Integration (Months 6-9)

- [ ] **Enhanced integration with Konnektr products**
- [ ] **Marketplace and catalog features**
- [ ] **Third-party integrations**
- [ ] **Enterprise features (SSO, compliance)**

### Scalability & Performance (Ongoing)

- [ ] **Database optimization and scaling**
- [ ] **Caching strategies**
- [ ] **CDN integration**
- [ ] **Multi-region deployment**

## 📈 Progress Tracking

### Completed This Week

_Update weekly with completed tasks_

### Current Sprint Goals

_Update with current week's objectives_

### Blockers & Dependencies

_Track anything preventing progress_

### Metrics & KPIs

- Code coverage percentage
- API response times
- User satisfaction scores
- Feature completion rate

## 🎯 Phase 2: Product Rebranding & Catalog Strategy (NEXT PRIORITY)

**Goal**: Implement product renaming and streamline catalog/homepage integration

### Immediate Actions

#### 1. Product Renaming

- [ ] **Rename Konnektr.DigitalTwins → Konnektr.Graph**

  - Update all schema files, forms, and components
  - Rename file names and directory structures
  - Update UI text and documentation references

- [ ] **Add new product types**
  - Konnektr.Assembler (AI-powered digital twin builder)
  - Konnektr.Flow (real-time data & event processing)
  - Konnektr.Compass (future navigation/discovery tool)

#### 2. Dynamic Tier System

- [ ] **Implement dynamic tier generation**
  - Modify CreateResourcePage to support dynamic tier lists
  - Prepare for future tier renaming and customization
  - Support tier selection via query parameters

#### 3. Catalog & Homepage Integration Strategy

- [ ] **Evaluate removing KtrlPlane CatalogPage**
  - Consolidate product discovery to main homepage
  - Implement homepage → create resource flow
  - Support tier pre-selection via URL parameters

**Homepage Integration Requirements:**

- Homepage should redirect to `/projects/{projectId}/resources/create?resourceType={type}&tier={tier}`
- Support authentication flow: homepage → login → project selection → resource creation
- Maintain consistency with existing auth patterns

## 🔄 Continuous Improvements

### Regular Reviews (Weekly)

- [ ] Update progress on current phase tasks
- [ ] Review and adjust priorities based on user feedback
- [ ] Update architectural decisions and learnings
- [ ] Plan next week's objectives

### Monthly Planning

- [ ] Review phase completion and timeline
- [ ] Adjust roadmap based on business priorities
- [ ] Update resource allocation and dependencies
- [ ] Conduct retrospectives and process improvements

---

## 📝 Change Log

Track all significant changes to this plan:

- **2025-01-27**: Initial comprehensive development plan created, consolidating all previous planning documents
- **[Future Date]**: [Description of changes]

---

**Note**: This document serves as the single source of truth for KtrlPlane development planning. Keep it updated with progress, new requirements, and architectural decisions.
