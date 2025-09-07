# Billing Integration Implementation Plan

## Current Status Assessment

### ✅ Completed Components

#### Backend Infrastructure

- [x] Database schema with billing tables (`003_add_billing_support.sql`)
- [x] Billing models and data structures (`internal/models/models.go`)
- [x] Complete billing service with Stripe integration (`internal/service/billing_service.go`)
- [x] API handlers for all billing operations (`internal/api/handlers.go`)
- [x] API routes for organization and project billing (`internal/api/routes.go`)
- [x] Stripe SDK initialization in main application
- [x] RBAC permissions for billing management

#### Frontend Infrastructure

- [x] Comprehensive billing UI (`web/src/features/billing/pages/BillingPage.tsx`)
- [x] Payment portal integration
- [x] Subscription management interface
- [x] Invoice and payment method display

### 🔄 Issues to Address

#### 1. **Billing Inheritance Logic**

- **Problem**: Project billing doesn't properly handle organization inheritance
- **Current**: Projects can have independent billing or inherit from org
- **Needed**: Smart redirection and permission checking

#### 2. **Stripe Branding Removal**

- **Problem**: UI shows "Stripe" references explicitly
- **Current**: "Setup Stripe Customer", "Open Stripe Customer Portal"
- **Needed**: Generic payment terminology

#### 3. **Configuration and Environment Setup**

- **Problem**: No environment variables or Stripe configuration documented
- **Current**: STRIPE_SECRET_KEY expected but not configured
- **Needed**: Complete environment setup guide

#### 4. **Subscription Plans and Pricing**

- **Problem**: No defined pricing structure or plans
- **Current**: Hardcoded "starter" plan
- **Needed**: Configurable plans with Stripe Price IDs

## Implementation Roadmap

### Phase 1: Environment Setup & Configuration (Week 1)

#### 1.1 Stripe Account Setup

- [ ] Create Stripe account for development/testing
- [ ] Configure webhook endpoints for subscription events
- [ ] Create product catalog and pricing plans
- [ ] Generate API keys (secret and publishable)
- [ ] Set up test mode for development

#### 1.2 Environment Configuration

```bash
# Required environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pricing configuration
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

#### 1.3 Configuration Updates

- [ ] Update `internal/config/config.go` with Stripe configuration
- [ ] Add webhook endpoint configuration
- [ ] Add pricing plan configuration
- [ ] Document environment setup in README

### Phase 2: Billing Inheritance Logic (Week 1-2)

#### 2.1 Backend Logic Enhancement

- [ ] **Update project billing service** to check inheritance
- [ ] **Add billing resolution logic** - if project inherits, redirect to org billing
- [ ] **Enhance permission checking** - verify org billing access when inherited
- [ ] **Update API responses** with inheritance information

#### 2.2 Frontend Inheritance Handling

- [ ] **Add inheritance detection** in BillingPage component
- [ ] **Implement redirection logic** for inherited billing
- [ ] **Add org billing link** when user has access but billing is inherited
- [ ] **Show inheritance status** in UI

```typescript
// Proposed inheritance logic
interface BillingInheritanceInfo {
  inherits_from_org: boolean;
  org_id?: string;
  org_name?: string;
  user_has_org_billing_access: boolean;
  redirect_to_org_billing: boolean;
}
```

### Phase 3: UI/UX Improvements (Week 2)

#### 3.1 Remove Stripe Branding

- [ ] Replace "Stripe Customer" with "Billing Account"
- [ ] Replace "Stripe Customer Portal" with "Payment Management Portal"
- [ ] Use generic payment terminology throughout
- [ ] Hide internal payment provider details

#### 3.2 Enhanced User Experience

- [ ] Add loading states for all billing operations
- [ ] Improve error handling and user feedback
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement progressive disclosure for complex operations

### Phase 4: Webhook Integration (Week 2-3)

#### 4.1 Webhook Handler Implementation

- [ ] **Create webhook endpoint** (`/api/v1/webhooks/stripe`)
- [ ] **Add webhook signature verification**
- [ ] **Handle subscription lifecycle events**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

#### 4.2 Database Synchronization

- [ ] **Update subscription status** from webhook events
- [ ] **Handle payment failures** and dunning management
- [ ] **Sync customer data** between Stripe and database
- [ ] **Add webhook event logging** for debugging

### Phase 5: Subscription Plans & Pricing (Week 3)

#### 5.1 Plan Configuration System

```go
type SubscriptionPlan struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Description string  `json:"description"`
    PriceID     string  `json:"stripe_price_id"`
    Features    []string `json:"features"`
    Limits      PlanLimits `json:"limits"`
}

type PlanLimits struct {
    MaxProjects   int `json:"max_projects"`
    MaxResources  int `json:"max_resources"`
    MaxUsers      int `json:"max_users"`
}
```

#### 5.2 Plan Management

- [ ] **Define subscription plans** (Starter, Pro, Enterprise)
- [ ] **Create plan comparison UI**
- [ ] **Add plan upgrade/downgrade flows**
- [ ] **Implement usage-based limitations**

### Phase 6: Testing & Polish (Week 3-4)

#### 6.1 Comprehensive Testing

- [ ] **Unit tests** for billing service methods
- [ ] **Integration tests** for API endpoints
- [ ] **Webhook testing** with Stripe CLI
- [ ] **End-to-end billing flow tests**

#### 6.2 Documentation

- [ ] **User documentation** for billing management
- [ ] **API documentation** for billing endpoints
- [ ] **Webhook configuration guide**
- [ ] **Troubleshooting guide**

## Implementation Priority

### High Priority (Week 1)

1. **Fix billing inheritance logic** - Critical for multi-tenant usage
2. **Remove Stripe branding** - Better user experience
3. **Environment setup** - Required for any testing

### Medium Priority (Week 2-3)

1. **Webhook integration** - Ensures data consistency
2. **Subscription plans** - Enables real billing
3. **Enhanced UX** - Improves user adoption

### Low Priority (Week 4)

1. **Advanced features** - Usage tracking, analytics
2. **Documentation** - Important but not blocking
3. **Performance optimization** - Can be done incrementally

## Technical Decisions

### Billing Inheritance Strategy

```typescript
// When accessing project billing:
if (project.inherits_billing_from_org) {
  if (user.hasOrgBillingPermission(project.org_id)) {
    // Redirect to org billing with return URL
    redirect(
      `/organizations/${project.org_id}/billing?return=/projects/${project.id}`
    );
  } else {
    // Show inheritance info with org contact
    showInheritanceMessage(project.org_id, project.org_name);
  }
}
```

### Stripe Integration Approach

- **Maintain Stripe as backend** - Well-established, reliable
- **Abstract payment provider** - UI should be provider-agnostic
- **Use Stripe Customer Portal** - Reduces custom implementation needed
- **Webhook-driven updates** - Ensures consistency with Stripe

### Error Handling Strategy

- **Graceful degradation** - Show basic info even if Stripe is unavailable
- **Detailed error logging** - For debugging webhook and API issues
- **User-friendly messages** - Hide technical details from users
- **Retry mechanisms** - For transient API failures

## Success Criteria

### Week 1 Goals

- [ ] Billing inheritance working correctly
- [ ] Stripe branding removed from UI
- [ ] Basic environment setup completed
- [ ] Can create and manage billing accounts

### Week 2 Goals

- [ ] Webhooks processing subscription events
- [ ] Plan selection and upgrade flows working
- [ ] Complete billing flow from signup to payment

### Week 3-4 Goals

- [ ] All billing features thoroughly tested
- [ ] Documentation complete
- [ ] Ready for production deployment

## Risk Mitigation

### Technical Risks

- **Stripe API changes** - Pin to specific API version
- **Webhook reliability** - Implement idempotency and retry logic
- **Data consistency** - Use database transactions and validation

### Business Risks

- **Payment failures** - Implement proper dunning management
- **Subscription changes** - Handle prorations correctly
- **Security** - Validate all webhook signatures and user permissions

This plan provides a clear roadmap for completing the billing integration while addressing the specific issues identified in the current implementation.
