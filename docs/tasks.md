# Development Tasks Tracker

## Phase 1: Enhanced Resource Management

### Week 1: Resource Type System ⏳

#### Backend Tasks

- [ ] Create resource types database migration (003_resource_types_system.sql)
- [ ] Implement ResourceType model and repository
- [ ] Add ResourceDeployment model and repository
- [ ] Create resource type registry service
- [ ] Add resource deployment API endpoints
- [ ] Update existing resource creation to use types

#### Frontend Tasks

- [ ] Create ResourceTypeRegistry utility
- [ ] Build dynamic form generator from JSON schema
- [ ] Implement ResourceTypeSelector component
- [ ] Add deployment status tracking components
- [ ] Update resource creation flow

#### API Endpoints to Implement

```
GET    /api/v1/resource-types
GET    /api/v1/resource-types/{type}
POST   /api/v1/resources/{id}/deploy
GET    /api/v1/resources/{id}/deployment
PUT    /api/v1/resources/{id}/deployment
DELETE /api/v1/resources/{id}/deployment
```

### Week 2: Custom Settings Pages ⏳

#### Schema Tasks

- [ ] Enhance AgeDigitalTwins schema with event sinks/routes
- [ ] Create Flows resource schema
- [ ] Add schema validation middleware
- [ ] Implement schema-to-form mapping

#### Component Tasks

- [ ] Build AgeDigitalTwinsSettings component
- [ ] Create EventSinksConfiguration component
- [ ] Implement EventRoutesConfiguration component
- [ ] Add FlowsSettings component
- [ ] Create settings preview component

#### Integration Tasks

- [ ] Connect settings to resource deployment
- [ ] Add settings validation
- [ ] Implement settings diff viewer
- [ ] Add settings export/import

### Week 3: Deployment Flow ⏳

#### Wizard Tasks

- [ ] Create multi-step deployment wizard
- [ ] Implement step validation and navigation
- [ ] Add deployment review step
- [ ] Build deployment progress tracking

#### Backend Integration

- [ ] Implement Helm client wrapper
- [ ] Add deployment status webhooks
- [ ] Create resource health monitoring
- [ ] Implement rollback functionality

#### UI Tasks

- [ ] Build deployment status dashboard
- [ ] Add deployment logs viewer
- [ ] Implement resource health indicators
- [ ] Create deployment history view

## Phase 2: Billing Integration

### Week 4: Database & Backend ⏳

#### Database Tasks

- [ ] Create billing schema migration (004_billing_system.sql)
- [ ] Add customer management tables
- [ ] Implement subscription tracking
- [ ] Create usage recording system

#### Backend Tasks

- [ ] Integrate Stripe SDK
- [ ] Implement customer service
- [ ] Add subscription management
- [ ] Create usage tracking middleware
- [ ] Add webhook handlers

### Week 5: Billing UI ⏳

#### Dashboard Tasks

- [ ] Create billing dashboard layout
- [ ] Implement current plan component
- [ ] Add usage metrics visualization
- [ ] Build invoice history view

#### Payment Tasks

- [ ] Integrate Stripe Elements
- [ ] Add payment method management
- [ ] Implement subscription upgrade/downgrade
- [ ] Create billing notifications

## Phase 3: Observability Integration

### Week 6: Backend Observability ⏳

#### Logging Tasks

- [ ] Implement structured logging with slog
- [ ] Add request correlation IDs
- [ ] Create log aggregation middleware
- [ ] Add performance metrics collection

#### Metrics Tasks

- [ ] Integrate Prometheus metrics
- [ ] Add custom business metrics
- [ ] Create health check endpoints
- [ ] Implement alerting rules

### Week 7: UI Integration ⏳

#### Logging UI

- [ ] Build log viewer component
- [ ] Add log filtering and search
- [ ] Implement real-time log streaming
- [ ] Create log export functionality

#### Metrics UI

- [ ] Create metrics dashboard
- [ ] Add resource health visualization
- [ ] Implement alert management UI
- [ ] Build debug information panels

## Quick Start Checklist

### To Start Phase 1 Development:

1. **Database Setup**

   ```bash
   # Run the new migration
   go run cmd/migrate/main.go
   ```

2. **Backend Models**

   ```bash
   # Create new model files
   touch internal/models/resource_type.go
   touch internal/models/resource_deployment.go
   touch internal/service/deployment_service.go
   ```

3. **Frontend Setup**

   ```bash
   # Create new component directories
   mkdir -p web/src/features/resource-types
   mkdir -p web/src/features/deployment
   mkdir -p web/src/components/forms
   ```

4. **API Routes**
   - Add resource type endpoints to routes.go
   - Implement handlers in internal/api/handlers.go
   - Add deployment status tracking

### Current Priority Tasks:

1. **🔥 HIGH**: Fix migration syntax and run database updates
2. **🔥 HIGH**: Implement basic resource type registry
3. **🔥 HIGH**: Create AgeDigitalTwins settings component
4. **📋 MEDIUM**: Add deployment status tracking
5. **📋 MEDIUM**: Build resource deployment wizard

### Success Metrics:

- [ ] User can select resource type from registry
- [ ] User can configure AgeDigitalTwins with event sinks
- [ ] Resource deployment status is tracked
- [ ] Settings are validated before deployment
- [ ] User can view deployment logs and health

This tracker will be updated as tasks are completed and new requirements emerge.
