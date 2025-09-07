# Updated Billing Implementation Plan - Resource-Based Usage Model

## **Architecture Overview**

### **Billing Hierarchy & Resource Pricing Model**

```
Organization (Primary Billing Account)
├── Stripe Customer
├── Stripe Subscription
│   ├── Base Plan (optional - for seat-based pricing)
│   └── Resource Usage Items (metered billing per resource type)
└── Projects
    ├── Project A (inherits_billing_from_org: true)
    │   └── Resources → Subscription items added to org subscription
    ├── Project B (inherits_billing_from_org: true)
    │   └── Resources → Subscription items added to org subscription
    └── Project C (inherits_billing_from_org: false)
        ├── Stripe Customer (separate)
        ├── Stripe Subscription (separate)
        └── Resources → Subscription items added to project subscription
```

## **User Flow Implementation Plan**

### **Flow 1: Project + Org Creation from Scratch**

**Trigger**: User creates first project
**UX Flow**:

1. Project creation form includes billing setup
2. Organization auto-created with billing account
3. Project inherits billing by default
4. Resources added → Auto-billed to org subscription

**Implementation**:

- Modify project creation to trigger org billing setup
- Default `inherits_billing_from_org: true`
- Auto-create billing account at org level

### **Flow 2: Resource Creation from Landing Page**

**Trigger**: User clicks "Create Resource" directly
**UX Flow**:

1. Resource creation wizard with project selection/creation
2. If no projects exist, create project + org with billing
3. Resource immediately added to subscription
4. Streamlined onboarding

**Implementation**:

- Resource creation wizard includes project/org setup
- Billing setup integrated into resource creation flow
- Auto-add resource as subscription item

### **Flow 3: Separate Project Billing**

**Trigger**: User wants cost separation between projects
**UX Flow**:

1. Project creation with "Billing Options" section
2. Choice: "Inherit from Organization" vs "Separate Billing"
3. If separate billing, redirect to billing setup after project creation
4. Resources in this project billed independently

**Implementation**:

- Project creation form with billing inheritance choice
- Separate billing setup flow for independent projects
- Clear indication of billing scope in UI

## **Technical Implementation Roadmap**

### **Phase 1: Resource-Based Billing (Week 1)**

#### 1.1 Resource Type → Stripe Price Mapping

```go
// Add to config or database
type ResourcePricing struct {
    ResourceType string `json:"resource_type"`
    StripePriceID string `json:"stripe_price_id"`
    BillingModel string `json:"billing_model"` // "metered", "per_unit", "tiered"
    Description string `json:"description"`
}
```

#### 1.2 Auto-Resource Billing Service

- [ ] **Create resource billing service**
- [ ] **Auto-add resources** as subscription items when created
- [ ] **Auto-remove resources** as subscription items when deleted
- [ ] **Handle billing inheritance** - add to org or project subscription

#### 1.3 Resource Lifecycle Integration

- [ ] **Hook into resource creation** - add billing item
- [ ] **Hook into resource deletion** - remove billing item
- [ ] **Usage tracking** for metered billing (future)

### **Phase 2: Enhanced Project Creation UX (Week 1-2)**

#### 2.1 Billing-Aware Project Creation

- [ ] **Add billing options** to project creation form
- [ ] **Inheritance choice** UI component
- [ ] **Conditional billing setup** based on inheritance choice
- [ ] **Clear billing scope** indicators in UI

#### 2.2 Billing Inheritance Logic

- [ ] **Smart billing resolution** - determine which subscription to use
- [ ] **Permission-aware redirection** for inherited billing
- [ ] **Inheritance status** in project billing pages

### **Phase 3: Resource Creation Wizard (Week 2)**

#### 3.1 Streamlined Resource Creation

- [ ] **Integrated project creation** in resource wizard
- [ ] **Auto-billing setup** for new users
- [ ] **Resource pricing preview** before creation

#### 3.2 Landing Page Integration

- [ ] **"Create Resource" flow** from landing page
- [ ] **Onboarding optimization** for new users
- [ ] **Billing transparency** in creation flow

### **Phase 4: Advanced Billing Features (Week 2-3)**

#### 4.1 Resource Pricing Management

- [ ] **Resource type configuration** system
- [ ] **Pricing tier management** (starter, pro, enterprise)
- [ ] **Usage-based billing** preparation

#### 4.2 Billing Analytics & Transparency

- [ ] **Cost breakdown** by project/resource
- [ ] **Usage analytics** dashboard
- [ ] **Billing forecasting** features

## **Database Schema Enhancements**

### **Resource Pricing Table**

```sql
CREATE TABLE IF NOT EXISTS ktrlplane.resource_pricing (
    resource_type VARCHAR(100) PRIMARY KEY,
    stripe_price_id VARCHAR(255) NOT NULL,
    billing_model VARCHAR(50) DEFAULT 'per_unit', -- 'per_unit', 'metered', 'tiered'
    base_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Resource Billing Items Tracking**

```sql
CREATE TABLE IF NOT EXISTS ktrlplane.resource_billing_items (
    resource_id VARCHAR(255) PRIMARY KEY,
    stripe_subscription_item_id VARCHAR(255),
    resource_type VARCHAR(100),
    billing_scope_type VARCHAR(50), -- 'organization' or 'project'
    billing_scope_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (resource_type) REFERENCES ktrlplane.resource_pricing(resource_type)
);
```

## **Key UX Decisions**

### **1. Default Billing Inheritance**

- **New projects inherit by default** - simpler for users
- **Explicit choice for separate billing** - advanced use case
- **Clear indicators** of billing scope throughout UI

### **2. Resource Creation Transparency**

- **Show pricing** before resource creation
- **Clear billing account** that will be charged
- **Cost estimation** for resource types

### **3. Billing Flexibility**

- **Easy switching** between inherited and separate billing
- **Project-level cost breakdown** even with inherited billing
- **Multiple billing accounts** per organization for different departments

## **Implementation Priority**

### **High Priority (Week 1)**

1. **Resource-based billing service** - Core functionality
2. **Billing inheritance logic** - Critical for user flows
3. **Enhanced project creation** - Core UX improvement

### **Medium Priority (Week 2)**

1. **Resource creation wizard** - Onboarding optimization
2. **Billing transparency features** - User trust and clarity
3. **Resource pricing configuration** - Business flexibility

### **Low Priority (Week 3+)**

1. **Advanced analytics** - Nice to have
2. **Usage-based billing** - Future scaling
3. **Multi-currency support** - International expansion

## **Success Metrics**

### **Week 1 Goals**

- [ ] Resources automatically billed when created
- [ ] Project creation with billing inheritance working
- [ ] Separate project billing functional

### **Week 2 Goals**

- [ ] Streamlined resource creation from landing page
- [ ] Clear billing cost breakdown
- [ ] All user flows working end-to-end

### **Week 3+ Goals**

- [ ] Advanced billing analytics
- [ ] Usage-based billing capabilities
- [ ] Production-ready billing system

This plan addresses your specific user flows while maintaining flexibility for future business model changes.
