# ktrlplane Development Tasks (Simplified)

## 🎯 Phase 1: Enhanced Resource Management (Current Priority)

> **Context**: We use [db-query-operator](https://github.com/konnektr-io/db-query-operator) for deployments, which greatly simplifies our approach. We only need to store user settings in the database - the operator handles all deployment complexity.

### Week 1: Schema Foundation ✅ READY TO START

#### Frontend Schema System

- [ ] **Create Zod schemas for resource types** `web/src/lib/resourceSchemas.ts`

  - [ ] Define `ageDigitalTwinsSchema` (instances, sinks, eventRoutes)
  - [ ] Define `flowsSchema` (replicas, memoryLimit, cpuLimit, environment)
  - [ ] Export TypeScript types from schemas
  - [ ] Add schema validation utilities

- [ ] **Set up dynamic form generation** `web/src/components/forms/`
  - [ ] Install react-hook-form and @hookform/resolvers/zod
  - [ ] Create `DynamicForm` component that renders from schemas
  - [ ] Build specialized input components (ArrayInput, ObjectInput, etc.)
  - [ ] Add real-time validation and error display

#### Backend Schema Validation

- [ ] **Add server-side validation** `internal/api/handlers.go`
  - [ ] Create resource type validation middleware
  - [ ] Implement JSON schema validation for settings_json
  - [ ] Add validation error responses with field-level errors
  - [ ] Update resource creation/update endpoints

### Week 2: Resource Configuration UI

#### AgeDigitalTwins Configuration

- [ ] **Build DigitalTwins settings page** `web/src/features/resources/components/DigitalTwinsSettings.tsx`
  - [ ] Instance count selector (1-10)
  - [ ] Sinks configuration (kafka, webhook, database types)
  - [ ] Event routes builder (source/destination/filters)
  - [ ] Configuration preview/validation

#### Flows Configuration

- [ ] **Build Flows settings page** `web/src/features/resources/components/FlowsSettings.tsx`
  - [ ] Replica count selector (1-5)
  - [ ] Resource limits (memory/CPU) with validation
  - [ ] Environment variables key-value editor
  - [ ] Configuration preview/validation

#### Form Enhancements

- [ ] **Add preset configurations** `web/src/lib/resourcePresets.ts`
  - [ ] Common DigitalTwins configurations (dev, staging, prod)
  - [ ] Common Flows configurations (small, medium, large)
  - [ ] Preset selector in forms
  - [ ] Export/import configuration functionality

### Week 3: db-query-operator Integration

#### Database Query Resources

- [ ] **Create DatabaseQueryResource CRs** `deployments/kubernetes/db-query-operator/`
  - [ ] CR for DigitalTwins resources (`digitaltwins-dbqr.yaml`)
  - [ ] CR for Flows resources (`flows-dbqr.yaml`)
  - [ ] Database connection secrets and config
  - [ ] Polling interval and pruning configuration

#### Deployment Templates

- [ ] **Create Git repository for templates** (separate repo or folder)
  - [ ] Helm charts for AgeDigitalTwins
  - [ ] Helm charts for Flows
  - [ ] Kustomize overlays for different environments
  - [ ] Template parameterization from database values

#### Operator Setup

- [ ] **Deploy and configure db-query-operator**
  - [ ] Install operator in Kubernetes cluster
  - [ ] Configure database access and credentials
  - [ ] Test query execution and template rendering
  - [ ] Verify resource creation/update/deletion

### Week 4: Status & Polish

#### Optional Status Integration

- [ ] **Add deployment status polling** (if needed)
  - [ ] Kubernetes API client for resource status
  - [ ] Resource health check utilities
  - [ ] Status update webhooks from operator
  - [ ] Display deployment status in UI

#### Error Handling & UX

- [ ] **Comprehensive error handling**
  - [ ] Form validation error display
  - [ ] API error handling and user messaging
  - [ ] Deployment failure notification
  - [ ] Rollback/retry mechanisms

#### Testing & Documentation

- [ ] **End-to-end testing**

  - [ ] Form validation test suite
  - [ ] API integration tests
  - [ ] Deployment flow testing
  - [ ] Performance testing

- [ ] **Documentation**
  - [ ] User guide for resource configuration
  - [ ] Developer guide for adding new resource types
  - [ ] db-query-operator integration guide
  - [ ] Troubleshooting documentation

---

## 🎯 Phase 2: Billing Integration (Weeks 5-8)

### Week 5: Stripe Foundation

- [ ] Set up Stripe integration and webhook handling
- [ ] Create customer and subscription management system
- [ ] Implement secure payment processing workflows
- [ ] Add subscription lifecycle event handling

### Week 6: Usage Tracking

- [ ] Build usage metrics collection system
- [ ] Create usage aggregation and reporting services
- [ ] Implement cost calculation engine
- [ ] Add usage-based billing triggers

### Week 7: Billing UI

- [ ] Create billing dashboard with usage analytics
- [ ] Build subscription management interface
- [ ] Add payment method management
- [ ] Implement cost optimization recommendations

### Week 8: Testing & Optimization

- [ ] Comprehensive testing of payment flows
- [ ] Load testing for usage tracking systems
- [ ] Security audit of payment handling
- [ ] Performance optimization and monitoring

---

## 🎯 Phase 3: Observability & Monitoring (Weeks 9-12)

### Week 9: Logging Foundation

- [ ] Implement structured logging across all services
- [ ] Set up log aggregation and storage system
- [ ] Create log analysis and search capabilities
- [ ] Add audit logging for security events

### Week 10: Metrics Collection

- [ ] Build metrics collection and storage infrastructure
- [ ] Create business and technical metric definitions
- [ ] Implement real-time metrics dashboards
- [ ] Set up automated alerting rules

### Week 11: Tracing Implementation

- [ ] Add distributed tracing to all service endpoints
- [ ] Create trace analysis and visualization tools
- [ ] Implement performance monitoring dashboards
- [ ] Build dependency mapping and service topology views

### Week 12: Integration & Optimization

- [ ] Integrate observability with existing monitoring tools
- [ ] Create comprehensive runbooks and alerting procedures
- [ ] Performance testing and optimization of observability stack
- [ ] Documentation and team training on observability tools

---

## 🚀 Current Focus: Week 1 Tasks

**IMMEDIATE NEXT STEPS:**

1. **Start with Frontend Schema System** - Define Zod schemas for resource types
2. **No database migration needed** - Use existing `settings_json` column
3. **Create dynamic forms** - React Hook Form + Zod integration
4. **Server-side validation** - Add JSON schema validation to API

The simplified approach means we can start immediately without complex database changes!
