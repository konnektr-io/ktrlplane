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
- [x] Resource forms for all 4 product types (Graph, Assembler, Flow, Compass)
- [x] Access control UI with role management
- [x] Comprehensive billing UI with Stripe integration
- [x] Stripe-only billing info (no SubscriptionStatus, SubscriptionPlan, BillingEmail in DB/models)
- [x] Canonical billing_accounts table for Stripe IDs
- [x] UI/UX: last invoice shown, not upcoming; "Current Period" field removed; pending cancellation state clearly indicated
- [x] Subscription cancellation workflow and portal guidance
- [x] Documentation accuracy improvements for billing and subscription flows

### 🔄 In Progress

- [ ] Documentation accuracy improvements
- [ ] Enhanced API features and validation

### 📋 Priority Features (Previously Documented)

Based on documentation audit, these features were described but not fully implemented:

- [ ] **API Enhancements**: Pagination, filtering, advanced query parameters
- [ ] **Webhook System**: Event notifications for resource lifecycle events
- [ ] **Auto-scaling**: Automatic resource scaling based on metrics
- [ ] **Tier Enforcement**: Usage limits and billing enforcement per tier
- [ ] **Advanced Configuration Validation**: Schema-based settings validation
- [ ] **Sophisticated Status Management**: Complex resource state transitions
- [ ] **Advanced Error Handling**: Detailed error codes and validation responses
- [ ] **SDK Development**: Official SDKs for JavaScript, Python, Go

### 📋 Backlog

- [ ] Advanced observability and monitoring
- [ ] Performance optimization
- [ ] Resource usage tracking and analytics

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

## 🎯 Phase 0: Documentation Accuracy & API Enhancement (Current Priority)

**Goal**: Ensure documentation matches actual implementation and prioritize valuable missing features

### Recently Completed: Documentation Audit ✅

- [x] **Full functionality audit** comparing docs vs actual code
- [x] **Removed overstated features** from documentation
  - Removed webhook system (not implemented)
  - Simplified API parameters (no pagination/filtering)
  - Removed auto-scaling features
  - Simplified tier enforcement descriptions
  - Updated configuration schemas to match JSON storage
- [x] **Marked future features** as planned rather than available
- [x] **Updated development plan** with realistic priorities

### Next Phase: API Enhancement Features

**Priority 1: Core API Improvements**
- [ ] **Add pagination support** to list endpoints (limit, offset parameters)
- [ ] **Add filtering capabilities** (by type, status, etc.)
- [ ] **Enhance error handling** with structured error responses
- [ ] **Add API request validation** with detailed error messages

**Priority 2: Resource Management Features**  
- [ ] **Implement tier enforcement** with usage limits
- [ ] **Add configuration validation** against schemas
- [ ] **Implement resource status transitions** (creating → running → updating)
- [ ] **Add usage tracking** for billing and limits

**Priority 3: Event System**
- [ ] **Design webhook system** for resource lifecycle events
- [ ] **Implement event logging** for audit trails
- [ ] **Add notification system** for status changes

## 🎯 Phase 1: Enhanced Resource Management (Future Phase)

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

  - Consolidate product discovery to main homepage
  - Implement homepage → create resource flow
  - Support tier pre-selection via URL parameters

**Homepage Integration Requirements:**





## 🔥 Logging & Metrics Backend (Loki/Mimir Proxy)

### Overview
KtrlPlane will provide secure, multi-tenant proxy endpoints for logs and metrics, integrating with Loki (logs) and Mimir (metrics) backends. All requests are authenticated, authorized, and scoped to the correct tenant using X-Scope-OrgID headers.

### Endpoints
- **Logs:** `GET /api/v1/resources/{resourceId}/logs?query={logQL}&start={ts}&end={ts}&limit=1000`
- **Metrics:** `GET /api/v1/resources/{resourceId}/metrics/query_range?query={promQL}&start={ts}&end={ts}&step=15s`

### Architecture
1. **Authentication:** All endpoints require Auth0 JWT (existing middleware).
2. **Authorization:** Use `PermissionService.CanUserAccessResource(userID, resourceID)` to enforce RBAC for each request.
3. **Tenant Scoping:** Use `ResourceService.GetResourceTenantID(resourceID)` to fetch the tenant ID and inject `X-Scope-OrgID` header for Loki/Mimir multi-tenancy.
4. **Query Rewriting:**
  - For logs: Rewrite LogQL query to inject resource-specific label filter (e.g., `pod_selector_label`).
  - For metrics: Optionally rewrite PromQL query for resource scoping.
5. **Reverse Proxy:** Use Go's `httputil.NewSingleHostReverseProxy` to forward requests to Loki/Mimir, with custom Director for header injection and query rewriting.
6. **Error Handling:**
  - 403/404 for denied or not found (do not leak resource existence)
  - 500 for internal errors
7. **Security:** Never forward requests without RBAC check and tenant header. Log denied/failed attempts for audit.
8. **Testability:** All proxy logic is dependency-injected for easy mocking in tests.

### Implementation Notes
- Proxy logic will be in `internal/api/proxy.go`.
- Endpoints will be added to `internal/api/routes.go`.
- All code follows clean architecture and security best practices.

---
## 🔄 Continuous Improvements

  - Resource creation page should auto-select last active project (from localStorage/Zustand)
  - If no project is found, prompt user to select or create a project
  - Add project selection dropdown to resource creation page, defaulting to last active project, but allowing user to choose another
  - If user changes project, update resource creation flow accordingly
  - Ensure flow works for users with multiple projects, no projects, or when coming from direct link

**Edge Cases:**
  - If user is not authenticated, redirect to login
  - If user has no projects, prompt to create one before proceeding
  - If user has multiple projects, allow selection via dropdown

**User Experience:**
  - Seamless flow: homepage → login (if needed) → resource creation page (with project selection) → resource configuration


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
