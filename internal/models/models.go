package models

import (
	"encoding/json"
	"time"
)

// Project represents a project in the system.
type Project struct {
	ProjectID   string  `json:"project_id" agtype:"project_id"`
	OrgID       *string `json:"org_id" agtype:"org_id" db:"org_id"`
	Name        string  `json:"name" agtype:"name"`
	Description string  `json:"description,omitempty" agtype:"description"`
	Status      string  `json:"status" agtype:"status"`
	// StripeCustomerID and StripeSubscriptionID removed; use BillingAccount
	BillingEmail           *string   `json:"billing_email,omitempty" db:"billing_email"`
	InheritsBillingFromOrg bool      `json:"inherits_billing_from_org" db:"inherits_billing_from_org"`
	CreatedAt              time.Time `json:"created_at" agtype:"created_at"`
	UpdatedAt              time.Time `json:"updated_at" agtype:"updated_at"`
}

// Resource represents a resource belonging to a project.
type Resource struct {
	ResourceID     string          `json:"resource_id" agtype:"resource_id"`
	ProjectID      string          `json:"project_id"` // Added for context, not directly in node usually
	Name           string          `json:"name" agtype:"name"`
	Type           string          `json:"type" agtype:"type"` // e.g., "GraphDatabase", "Flow"
	Status         string          `json:"status" agtype:"status"`
	SKU            string          `json:"sku" agtype:"sku"` // Resource tier (e.g., "free", "basic", "pro")
	StripePriceID  *string         `json:"stripe_price_id,omitempty" agtype:"stripe_price_id"` // Stripe price ID for paid tiers
	SettingsJSON   json.RawMessage `json:"settings_json" agtype:"settings_json"` // Store as raw JSON
	CreatedAt      time.Time       `json:"created_at" agtype:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at" agtype:"updated_at"`
	ErrorMessage   *string         `json:"error_message,omitempty" agtype:"error_message"`
}

// MarshalJSON ensures settings_json is always a JSON object (never a string/null).
func (r Resource) MarshalJSON() ([]byte, error) {
	type Alias Resource
	tmp := struct {
		Alias
		SettingsJSON json.RawMessage `json:"settings_json"`
	}{
		Alias:        (Alias)(r),
		SettingsJSON: r.SettingsJSON,
	}

	// If SettingsJSON is nil or empty, marshal as {}
	if len(r.SettingsJSON) == 0 || string(r.SettingsJSON) == "null" || string(r.SettingsJSON) == "" {
		tmp.SettingsJSON = []byte("{}")
	}

	return json.Marshal(tmp)
}

// --- API Request/Response Payloads ---

// CreateOrganizationRequest is the payload for creating an organization.
type CreateOrganizationRequest struct {
	ID   string `json:"id" binding:"required"`
	Name string `json:"name" binding:"required"`
}

// UpdateOrganizationRequest is the payload for updating an organization.
type UpdateOrganizationRequest struct {
	Name string `json:"name" binding:"required"`
}

// CreateProjectRequest is the payload for creating a project.
type CreateProjectRequest struct {
	ID          string  `json:"id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	OrgID       *string `json:"org_id,omitempty"`
}

// UpdateProjectRequest is the payload for updating a project.
type UpdateProjectRequest struct {
	Name        *string `json:"name"` // Use pointers to distinguish between empty and not provided
	Description *string `json:"description"`
}

// CreateResourceRequest is the payload for creating a resource.
type CreateResourceRequest struct {
	ID           string          `json:"id" binding:"required"`
	Name         string          `json:"name" binding:"required"`
	Type         string          `json:"type" binding:"required"` // e.g., "GraphDatabase"
	SKU          string          `json:"sku" binding:"required"`  // Resource tier (e.g., "free", "basic", "pro")
	SettingsJSON json.RawMessage `json:"settings_json"`           // Initial settings as JSON
}

// UpdateResourceRequest is the payload for updating a resource.
type UpdateResourceRequest struct {
	Name         *string         `json:"name"`
	SKU          *string         `json:"sku"` // Allow SKU/tier changes
	SettingsJSON json.RawMessage `json:"settings_json"` // Send full JSON structure to update
}

// User represents a user in the system (simplified for identifying user from token).
type User struct {
	ID    string   `json:"id"`              // Subject from JWT
	Email string   `json:"email"`           // Email from JWT
	Name  string   `json:"name"`            // Name from JWT
	Roles []string `json:"roles,omitempty"` // Roles derived from JWT or DB lookup (placeholder)
}

// RBAC Models

// Organization represents an organization in the system.
type Organization struct {
	OrgID string `json:"org_id" db:"org_id"`
	Name  string `json:"name" db:"name"`
	// StripeCustomerID and StripeSubscriptionID removed; use BillingAccount
	BillingEmail *string   `json:"billing_email,omitempty" db:"billing_email"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// Role represents a role in the RBAC system.
type Role struct {
	RoleID      string    `json:"role_id" db:"role_id"`
	Name        string    `json:"name" db:"name"`
	DisplayName string    `json:"display_name" db:"display_name"`
	Description string    `json:"description" db:"description"`
	IsSystem    bool      `json:"is_system" db:"is_system"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Permission represents a permission in the RBAC system.
type Permission struct {
	PermissionID string    `json:"permission_id" db:"permission_id"`
	ResourceType string    `json:"resource_type" db:"resource_type"`
	Action       string    `json:"action" db:"action"`
	Description  string    `json:"description" db:"description"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// RoleAssignment represents a role assignment in the RBAC system.
type RoleAssignment struct {
	AssignmentID string     `json:"assignment_id" db:"assignment_id"`
	UserID       string     `json:"user_id" db:"user_id"`
	RoleID       string     `json:"role_id" db:"role_id"`
	ScopeType    string     `json:"scope_type" db:"scope_type"` // "organization", "project", "resource"
	ScopeID      string     `json:"scope_id" db:"scope_id"`
	AssignedBy   string     `json:"assigned_by" db:"assigned_by"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	ExpiresAt    *time.Time `json:"expires_at" db:"expires_at"`
}

// RoleAssignmentWithDetails includes populated user and role information.
type RoleAssignmentWithDetails struct {
	AssignmentID string     `json:"assignment_id"`
	UserID       string     `json:"user_id"`
	RoleID       string     `json:"role_id"`
	ScopeType    string     `json:"scope_type"`
	ScopeID      string     `json:"scope_id"`
	AssignedBy   string     `json:"assigned_by"`
	CreatedAt    time.Time  `json:"created_at"`
	ExpiresAt    *time.Time `json:"expires_at"`

	// Populated fields
	User User `json:"user"`
	Role Role `json:"role"`

	// Inheritance information
	InheritanceType        string `json:"inheritance_type"`                    // "direct" or "inherited"
	InheritedFromScopeType string `json:"inherited_from_scope_type,omitempty"` // "organization" or "project"
	InheritedFromScopeID   string `json:"inherited_from_scope_id,omitempty"`   // ID of the parent scope
	InheritedFromName      string `json:"inherited_from_name,omitempty"`       // Name of the parent scope
}

// UserPermission is the result of a permission check.
type UserPermission struct {
	UserID        string `json:"user_id"`
	ResourceType  string `json:"resource_type"`
	Action        string `json:"action"`
	ScopeType     string `json:"scope_type"`
	ScopeID       string `json:"scope_id"`
	HasPermission bool   `json:"has_permission"`
}

// BillingAccount represents a billing account for an organization or project.
type BillingAccount struct {
	BillingAccountID     string    `json:"billing_account_id" db:"billing_account_id"`
	ScopeType            string    `json:"scope_type" db:"scope_type"` // "organization" or "project"
	ScopeID              string    `json:"scope_id" db:"scope_id"`
	StripeCustomerID     *string   `json:"stripe_customer_id,omitempty" db:"stripe_customer_id"`
	StripeSubscriptionID *string   `json:"stripe_subscription_id,omitempty" db:"stripe_subscription_id"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// CreateStripeCustomerRequest is the payload for creating a Stripe customer.
type CreateStripeCustomerRequest struct {
	Description string `json:"description,omitempty"`
}

// CreateStripeSubscriptionRequest is the payload for creating a Stripe subscription.
type CreateStripeSubscriptionRequest struct {
	PriceID         string `json:"price_id,omitempty"`
	PaymentMethodID string `json:"payment_method_id,omitempty"`
}

// BillingInfo contains billing information for an organization or project.
type BillingInfo struct {
	BillingAccount       BillingAccount             `json:"billing_account"`
	StripeCustomer       *StripeCustomer            `json:"stripe_customer,omitempty"`
	StripeCustomerPortal *string                    `json:"stripe_customer_portal,omitempty"`
	LastestInvoice       *StripeInvoice             `json:"latest_invoice,omitempty"`
	PaymentMethods       []StripePaymentMethod      `json:"payment_methods,omitempty"`
	SubscriptionItems    []StripeSubscriptionItem   `json:"subscription_items,omitempty"`
	SubscriptionDetails  *StripeSubscriptionDetails `json:"subscription_details,omitempty"`
}

// StripeInvoice represents a Stripe invoice.
type StripeInvoice struct {
	ID               string  `json:"id"`
	AmountDue        int64   `json:"amount_due"`
	Currency         string  `json:"currency"`
	PeriodStart      int64   `json:"period_start"`
	PeriodEnd        int64   `json:"period_end"`
	Status           string  `json:"status"`
	HostedInvoiceURL *string `json:"hosted_invoice_url,omitempty"`
}

// StripePaymentMethod represents a Stripe payment method.
type StripePaymentMethod struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Card *struct {
		Brand    string `json:"brand"`
		Last4    string `json:"last4"`
		ExpMonth int64  `json:"exp_month"`
		ExpYear  int64  `json:"exp_year"`
	} `json:"card,omitempty"`
}

// StripeSubscriptionItem represents a Stripe subscription item.
type StripeSubscriptionItem struct {
	ID       string `json:"id"`
	Quantity int64  `json:"quantity"`
	Price    *struct {
		ID         string `json:"id"`
		UnitAmount int64  `json:"unit_amount"`
		Currency   string `json:"currency"`
		Recurring  *struct {
			Interval      string `json:"interval"`
			IntervalCount int64  `json:"interval_count"`
		} `json:"recurring,omitempty"`
		Product *struct {
			ID          string `json:"id"`
			Name        string `json:"name"`
			Description string `json:"description"`
		} `json:"product,omitempty"`
	} `json:"price,omitempty"`
}

// StripeSubscriptionDetails contains details about a Stripe subscription.
type StripeSubscriptionDetails struct {
	ID                 string `json:"id"`
	Status             string `json:"status"`
	CurrentPeriodStart int64  `json:"current_period_start"`
	CurrentPeriodEnd   int64  `json:"current_period_end"`
	CancelAtPeriodEnd  bool   `json:"cancel_at_period_end"`
}

// StripeCustomer represents a Stripe customer for billing info
type StripeCustomer struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
}

type ResourceTierPrice struct {
	PriceID      string `json:"price_id"`
	Amount       int64  `json:"amount"`
	Currency     string `json:"currency"`
	Interval     string `json:"interval"`
	SKU          string `json:"sku"`
	ResourceType string `json:"resource_type"`
}
