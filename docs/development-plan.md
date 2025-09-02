# Development Plan for ktrlplane

## Overview

This document outlines the development roadmap for ktrlplane, focusing on three main areas:

1. **Enhanced Resource Management** - Dynamic resource types with custom configuration
2. **Billing Integration** - Stripe integration for usage tracking and payments
3. **Observability** - Logging, metrics, and tracing integration

The plan prioritizes user value delivery with Phase 1 being the highest priority.

**Important Context**: We use the [db-query-operator](https://github.com/konnektr-io/db-query-operator) for deployment management. This operator queries our database and generates Kubernetes resources based on the stored configuration. This means we only need to manage the database and UI - the operator handles all deployment complexity.

---

## Phase 1: Enhanced Resource Management 🎯

**Goal**: Create a flexible resource management system with JSON schema-driven UI forms that stores minimal user settings for the db-query-operator to consume.

### Technical Approach (Simplified)

With the db-query-operator handling deployments, our approach becomes much simpler:

1. **Store JSON schemas in the UI** for each resource type (DigitalTwins, Flows)
2. **Generate dynamic forms** from these schemas for user configuration
3. **Store minimal settings** in the existing `settings_json` column
4. **Let db-query-operator** handle deployment, status tracking, and lifecycle
5. **Optionally poll** for deployment status updates via Kubernetes APIs

### Database Schema Changes

**No complex schema changes needed!** Our existing tables already support this:

- `resources.settings_json` - stores the minimal user configuration
- Existing RBAC and organization structure works as-is
- Optional: Add simple status fields if needed for deployment tracking

### Key Components

#### 1. JSON Schema Management

- **Frontend Schema Storage**: Store Zod/JSON schemas in the React app
- **Dynamic Form Generation**: Generate forms from schemas using libraries like `react-hook-form` + `@hookform/resolvers/zod`
- **Validation**: Client and server-side validation using same schemas
- **Type Safety**: Use schemas to generate TypeScript types

#### 2. Resource Type Configurations

For **AgeDigitalTwins** (Graph Database):

```typescript
const ageDigitalTwinsSchema = z.object({
  instances: z.number().min(1).max(10).default(1),
  sinks: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["kafka", "webhook", "database"]),
        config: z.record(z.string()),
      })
    )
    .default([]),
  eventRoutes: z
    .array(
      z.object({
        source: z.string(),
        destination: z.string(),
        filters: z.array(z.string()).default([]),
      })
    )
    .default([]),
});
```

For **Flows**:

```typescript
const flowsSchema = z.object({
  replicas: z.number().min(1).max(5).default(1),
  memoryLimit: z.string().default("512Mi"),
  cpuLimit: z.string().default("500m"),
  environment: z.record(z.string()).default({}),
});
```

#### 3. db-query-operator Integration

- **DatabaseQueryResource**: Create CRs that query our `resources` table
- **Template Management**: Store Helm/Kustomize templates in Git
- **Status Updates**: Optional status update queries to track deployment health

## Development Roadmap

### Implementation Tasks

#### Week 1: Schema Foundation

- [ ] Define JSON schemas for AgeDigitalTwins and Flows resource types
- [ ] Create dynamic form generation system using react-hook-form + Zod
- [ ] Implement client-side validation with real-time feedback
- [ ] Add server-side validation using same schemas

#### Week 2: Resource Type UI

- [ ] Build AgeDigitalTwins configuration form (instances, sinks, event routes)
- [ ] Create Flows configuration form (replicas, resources, environment)
- [ ] Add form presets and templates for common configurations
- [ ] Implement configuration preview and validation

#### Week 3: db-query-operator Setup

- [ ] Create DatabaseQueryResource CRs for each resource type
- [ ] Store deployment templates in Git repository
- [ ] Set up operator to query resources table and deploy via templates
- [ ] Test end-to-end deployment flow

#### Week 4: Status & Polish

- [ ] Add optional deployment status polling (if needed)
- [ ] Implement error handling and user feedback
- [ ] Add comprehensive testing
- [ ] Documentation and user guides

### Success Criteria

- [ ] Users can configure resources using dynamic, schema-validated forms
- [ ] Configurations stored in `settings_json` are consumed by db-query-operator
- [ ] Deployments happen automatically when resources are created/updated
- [ ] Form validation provides immediate feedback with clear error messages
- [ ] Sub-second form response times with zero deployment complexity in UI

---

## Phase 2: Billing Integration 💳

**Goal**: Implement comprehensive billing system with Stripe integration for usage tracking, subscription management, and automated billing.

### Technical Approach

Build a robust billing system that:

- Tracks resource usage and consumption metrics
- Integrates with Stripe for payment processing
- Provides usage analytics and cost optimization insights
- Handles subscription lifecycle management

### Key Components

#### 1. Usage Tracking System

- **Metrics Collection**: Track resource usage, API calls, storage consumption
- **Usage Aggregation**: Daily/monthly usage summaries and trending
- **Cost Calculation**: Convert usage metrics to billable amounts
- **Usage Limits**: Enforce plan-based usage restrictions

#### 2. Stripe Integration

- **Customer Management**: Sync users with Stripe customer records
- **Subscription Handling**: Plan management, upgrades, downgrades
- **Payment Processing**: Secure payment collection and webhook handling
- **Invoice Generation**: Automated invoicing based on usage

#### 3. Billing Dashboard

- **Usage Analytics**: Visual representation of consumption patterns
- **Cost Breakdown**: Detailed billing information by resource type
- **Payment History**: Transaction history and receipt management
- **Plan Management**: Self-service subscription changes

### Implementation Tasks

#### Week 1: Stripe Foundation

- [ ] Set up Stripe integration and webhook handling
- [ ] Create customer and subscription management system
- [ ] Implement secure payment processing workflows
- [ ] Add subscription lifecycle event handling

#### Week 2: Usage Tracking

- [ ] Build usage metrics collection system
- [ ] Create usage aggregation and reporting services
- [ ] Implement cost calculation engine
- [ ] Add usage-based billing triggers

#### Week 3: Billing UI

- [ ] Create billing dashboard with usage analytics
- [ ] Build subscription management interface
- [ ] Add payment method management
- [ ] Implement cost optimization recommendations

#### Week 4: Testing & Optimization

- [ ] Comprehensive testing of payment flows
- [ ] Load testing for usage tracking systems
- [ ] Security audit of payment handling
- [ ] Performance optimization and monitoring

### Success Criteria

- [ ] Accurate usage tracking with sub-minute granularity
- [ ] Seamless Stripe integration with 99.9% payment success rate
- [ ] Self-service billing management for users
- [ ] Automated invoice generation and payment collection
- [ ] Usage optimization insights reducing costs by 15%+

---

## Phase 3: Observability & Monitoring 📊

**Goal**: Implement comprehensive observability with structured logging, metrics collection, distributed tracing, and monitoring dashboards.

### Technical Approach

Create a full observability stack that:

- Provides structured logging with correlation IDs
- Collects business and technical metrics
- Implements distributed tracing across services
- Offers real-time monitoring and alerting

### Key Components

#### 1. Logging Infrastructure

- **Structured Logging**: JSON-formatted logs with consistent schema
- **Log Aggregation**: Centralized log collection and storage
- **Log Analysis**: Search, filtering, and correlation capabilities
- **Audit Logging**: Security and compliance event tracking

#### 2. Metrics & Monitoring

- **Business Metrics**: User engagement, resource utilization, revenue metrics
- **Technical Metrics**: API performance, error rates, system health
- **Custom Dashboards**: Real-time operational dashboards
- **Alerting System**: Proactive notification of issues and anomalies

#### 3. Distributed Tracing

- **Request Tracing**: End-to-end request tracking across services
- **Performance Analysis**: Identify bottlenecks and optimization opportunities
- **Error Correlation**: Link errors to specific request contexts
- **Dependency Mapping**: Visualize service interactions and dependencies

### Implementation Tasks

#### Week 1: Logging Foundation

- [ ] Implement structured logging across all services
- [ ] Set up log aggregation and storage system
- [ ] Create log analysis and search capabilities
- [ ] Add audit logging for security events

#### Week 2: Metrics Collection

- [ ] Build metrics collection and storage infrastructure
- [ ] Create business and technical metric definitions
- [ ] Implement real-time metrics dashboards
- [ ] Set up automated alerting rules

#### Week 3: Tracing Implementation

- [ ] Add distributed tracing to all service endpoints
- [ ] Create trace analysis and visualization tools
- [ ] Implement performance monitoring dashboards
- [ ] Build dependency mapping and service topology views

#### Week 4: Integration & Optimization

- [ ] Integrate observability with existing monitoring tools
- [ ] Create comprehensive runbooks and alerting procedures
- [ ] Performance testing and optimization of observability stack
- [ ] Documentation and team training on observability tools

### Success Criteria

- [ ] Complete request tracing with <1ms overhead
- [ ] 99.9% log ingestion reliability with <30s delay
- [ ] Proactive alerting with <5% false positive rate
- [ ] Mean time to detection (MTTD) under 2 minutes for critical issues
- [ ] Mean time to resolution (MTTR) reduced by 50%

---

## Implementation Priority

1. **Start with Phase 1** - Resource management provides immediate user value
2. **Phase 2 follows** - Billing enables business sustainability
3. **Phase 3 completes** - Observability ensures operational excellence

Each phase builds upon the previous, creating a comprehensive platform that serves users effectively while maintaining operational excellence and business viability.

**Backend Changes:**

```go
// internal/models/resource_types.go
type ResourceType struct {
    Name           string                 `json:"name"`
    DisplayName    string                 `json:"display_name"`
    Description    string                 `json:"description"`
    SettingsSchema map[string]interface{} `json:"settings_schema"`
    DeploymentSpec DeploymentSpec         `json:"deployment_spec"`
}

type DeploymentSpec struct {
    HelmChart    string            `json:"helm_chart"`
    ChartVersion string            `json:"chart_version"`
    Repository   string            `json:"repository"`
    Dependencies []string          `json:"dependencies"`
    HealthChecks []HealthCheck     `json:"health_checks"`
}
```

**Database Migration:**

```sql
-- 003_resource_types_system.sql
CREATE TABLE ktrlplane.resource_types (
    type_name VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    settings_schema JSONB NOT NULL,
    deployment_spec JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ktrlplane.resource_deployments (
    deployment_id VARCHAR(255) PRIMARY KEY,
    resource_id VARCHAR(255) REFERENCES ktrlplane.resources(resource_id),
    status VARCHAR(50) NOT NULL, -- pending, deploying, ready, failed
    helm_release_name VARCHAR(255),
    deployment_logs JSONB,
    health_status JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**

```
GET    /api/v1/resource-types              # List available resource types
GET    /api/v1/resource-types/{type}       # Get resource type details
POST   /api/v1/projects/{id}/resources     # Create resource (enhanced)
GET    /api/v1/resources/{id}/deployment   # Get deployment status
POST   /api/v1/resources/{id}/deploy       # Trigger deployment
DELETE /api/v1/resources/{id}/deployment   # Remove deployment
```

#### Week 2: Custom Settings Pages

**Frontend Components:**

```tsx
// ResourceTypeRegistry.ts
export const ResourceTypeRegistry = {
  "Konnektr.DigitalTwins": {
    settingsComponent: AgeDigitalTwinsSettings,
    deploymentComponent: AgeDigitalTwinsDeployment,
    schema: AgeDigitalTwinsSchema,
  },
  "Konnektr.Flows": {
    settingsComponent: FlowsSettings,
    deploymentComponent: FlowsDeployment,
    schema: FlowsSchema,
  },
};

// AgeDigitalTwinsSettings.tsx
const AgeDigitalTwinsSettings = ({ settings, onChange }) => {
  return (
    <div className="space-y-6">
      <EventSinksConfiguration />
      <EventRoutesConfiguration />
      <DatabaseConfiguration />
    </div>
  );
};
```

**Schema Definitions:**

```typescript
// Enhanced AgeDigitalTwins schema
export const AgeDigitalTwinsSchema = z.object({
  instances: z.number().int().min(1).max(6),
  eventSinks: z.object({
    kafka: z.array(KafkaSinkSchema),
    kusto: z.array(KustoSinkSchema),
    mqtt: z.array(MqttSinkSchema),
  }),
  eventRoutes: z.array(EventRouteSchema),
  database: z.object({
    storageClass: z.string(),
    storageSize: z.string(),
    backupEnabled: z.boolean(),
  }),
});
```

#### Week 3: Deployment Flow

**Deployment Wizard:**

```tsx
// ResourceDeploymentWizard.tsx
const DeploymentWizard = () => {
  const steps = [
    { title: "Basic Info", component: BasicInfoStep },
    { title: "Configuration", component: ConfigurationStep },
    { title: "Review", component: ReviewStep },
    { title: "Deploy", component: DeployStep },
  ];

  return <StepperWizard steps={steps} />;
};
```

**Backend Deployment Service:**

```go
// internal/service/deployment_service.go
type DeploymentService struct {
    helmClient    HelmClient
    k8sClient     KubernetesClient
    resourceRepo  ResourceRepository
}

func (s *DeploymentService) DeployResource(ctx context.Context, resourceID string) error {
    // 1. Generate Helm values from resource settings
    // 2. Deploy Helm chart
    // 3. Monitor deployment status
    // 4. Update resource deployment record
}
```

### 💳 Phase 2: Billing Integration

#### Week 4: Database & Backend

**Database Schema:**

```sql
-- 004_billing_system.sql
CREATE TABLE ktrlplane.billing_customers (
    customer_id VARCHAR(255) PRIMARY KEY,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    org_id VARCHAR(255) REFERENCES ktrlplane.organizations(org_id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ktrlplane.subscriptions (
    subscription_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) REFERENCES ktrlplane.billing_customers(customer_id),
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ktrlplane.usage_records (
    record_id VARCHAR(255) PRIMARY KEY,
    subscription_id VARCHAR(255) REFERENCES ktrlplane.subscriptions(subscription_id),
    resource_id VARCHAR(255) REFERENCES ktrlplane.resources(resource_id),
    metric_name VARCHAR(255) NOT NULL,
    usage_quantity DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    billing_period VARCHAR(20) NOT NULL
);
```

**Stripe Integration:**

```go
// internal/billing/stripe_service.go
type StripeService struct {
    client *stripe.Client
}

func (s *StripeService) CreateCustomer(orgID, email, name string) (*billing.Customer, error)
func (s *StripeService) CreateSubscription(customerID, priceID string) (*billing.Subscription, error)
func (s *StripeService) RecordUsage(subscriptionItemID string, quantity int64) error
func (s *StripeService) HandleWebhook(payload []byte, signature string) error
```

#### Week 5: Billing UI

**Frontend Components:**

```tsx
// BillingDashboard.tsx
const BillingDashboard = () => {
  return (
    <div className="space-y-6">
      <CurrentPlan />
      <UsageMetrics />
      <InvoiceHistory />
      <PaymentMethods />
    </div>
  );
};

// UsageMetrics.tsx
const UsageMetrics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Active Resources" value={usage.resources} />
      <MetricCard title="API Calls" value={usage.apiCalls} />
      <MetricCard title="Storage Used" value={usage.storage} />
    </div>
  );
};
```

### 📊 Phase 3: Observability Integration

#### Week 6: Backend Observability

**Structured Logging:**

```go
// internal/observability/logger.go
type Logger struct {
    logger *slog.Logger
}

func (l *Logger) WithRequest(ctx context.Context) *slog.Logger {
    requestID := ctx.Value("request-id").(string)
    userID := ctx.Value("user-id").(string)
    return l.logger.With("request_id", requestID, "user_id", userID)
}
```

**Metrics Collection:**

```go
// internal/observability/metrics.go
var (
    RequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request duration",
        },
        []string{"method", "endpoint", "status"},
    )

    ResourceDeployments = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "resource_deployments_total",
            Help: "Total resource deployments",
        },
        []string{"type", "status"},
    )
)
```

#### Week 7: UI Integration

**Log Viewer Component:**

```tsx
// LogViewer.tsx
const LogViewer = ({ resourceId }: { resourceId: string }) => {
  const { logs, isLoading } = useResourceLogs(resourceId);

  return (
    <div className="space-y-4">
      <LogFilters />
      <VirtualizedLogList logs={logs} />
    </div>
  );
};
```

**Metrics Dashboard:**

```tsx
// MetricsDashboard.tsx
const MetricsDashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ResourceHealthChart />
      <DeploymentStatusChart />
      <APIUsageChart />
      <ErrorRateChart />
    </div>
  );
};
```

## Implementation Strategy

### 🎯 Start with Phase 1 (Resource Management)

**Why First:**

- Directly impacts user experience
- Unlocks advanced resource types
- Foundation for other features
- High user value

### 🛠️ Technical Approach

1. **Schema-First Development**: Define resource type schemas before implementation
2. **Component-Based UI**: Reusable components for different resource types
3. **Event-Driven Architecture**: Use events for deployment status updates
4. **Progressive Enhancement**: Start with basic features, add complexity iteratively

### 📋 Success Criteria

**Phase 1 Complete When:**

- [ ] Users can deploy AgeDigitalTwins with custom settings
- [ ] Deployment status is tracked and displayed
- [ ] Resource health is monitored
- [ ] Settings can be updated post-deployment

**Phase 2 Complete When:**

- [ ] Organizations can subscribe to billing plans
- [ ] Usage is tracked and billed correctly
- [ ] Users can view billing dashboards
- [ ] Stripe webhooks are processed

**Phase 3 Complete When:**

- [ ] Resource logs are aggregated and searchable
- [ ] Metrics are collected and displayed
- [ ] Alerts can be configured
- [ ] Debug information is easily accessible

## Risk Mitigation

### 🔒 Technical Risks

- **Helm Integration Complexity**: Start with simple deployments, add complexity
- **Billing Accuracy**: Implement comprehensive testing for usage tracking
- **Log Volume**: Use efficient storage and querying strategies

### 🚀 Delivery Risks

- **Scope Creep**: Stick to defined MVP for each phase
- **Dependencies**: Identify and mitigate external dependencies early
- **Testing**: Implement automated testing at each phase

This plan provides a clear path to production readiness while maintaining development velocity and user value delivery.
