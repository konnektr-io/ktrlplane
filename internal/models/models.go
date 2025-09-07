package models

import (
	"encoding/json"
	"time"
)

// Using map[string]interface{} for flexibility with AGE properties initially.
// Consider defining more specific structs if properties are stable.

type Project struct {
	ProjectID                string    `json:"project_id" agtype:"project_id"`
	OrgID                    *string   `json:"org_id" agtype:"org_id" db:"org_id"`
	Name                     string    `json:"name" agtype:"name"`
	Description              string    `json:"description,omitempty" agtype:"description"`
	Status                   string    `json:"status" agtype:"status"`
	StripeCustomerID         *string   `json:"stripe_customer_id,omitempty" db:"stripe_customer_id"`
	StripeSubscriptionID     *string   `json:"stripe_subscription_id,omitempty" db:"stripe_subscription_id"`
	SubscriptionStatus       string    `json:"subscription_status" db:"subscription_status"`
	SubscriptionPlan         string    `json:"subscription_plan" db:"subscription_plan"`
	BillingEmail             *string   `json:"billing_email,omitempty" db:"billing_email"`
	InheritsBillingFromOrg   bool      `json:"inherits_billing_from_org" db:"inherits_billing_from_org"`
	CreatedAt                time.Time `json:"created_at" agtype:"created_at"`
	UpdatedAt                time.Time `json:"updated_at" agtype:"updated_at"`
}

type Resource struct {
	ResourceID   string          `json:"resource_id" agtype:"resource_id"`
	ProjectID    string          `json:"project_id"` // Added for context, not directly in node usually
	Name         string          `json:"name" agtype:"name"`
	Type         string          `json:"type" agtype:"type"` // e.g., "GraphDatabase", "Flow"
	Status       string          `json:"status" agtype:"status"`
	SettingsJSON json.RawMessage `json:"settings_json" agtype:"settings_json"` // Store as raw JSON
	CreatedAt    time.Time       `json:"created_at" agtype:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at" agtype:"updated_at"`
	ErrorMessage *string         `json:"error_message,omitempty" agtype:"error_message"`
	// Specific fields for resource types might be present but accessed via HelmValues
	AccessURL *string `json:"access_url,omitempty" agtype:"access_url"` // Example specific field
}

// Custom MarshalJSON to ensure settings_json is always a JSON object (never a string/null)
func (r Resource) MarshalJSON() ([]byte, error) {
	type Alias Resource
	tmp := struct {
		Alias
		SettingsJSON json.RawMessage `json:"settings_json"`
	}{
		Alias:       (Alias)(r),
		SettingsJSON: r.SettingsJSON,
	}

	// If SettingsJSON is nil or empty, marshal as {}
	if len(r.SettingsJSON) == 0 || string(r.SettingsJSON) == "null" || string(r.SettingsJSON) == "" {
		tmp.SettingsJSON = []byte("{}")
	}

	return json.Marshal(tmp)
}

// --- API Request/Response Payloads ---

type CreateOrganizationRequest struct {
	ID   string `json:"id" binding:"required"`
	Name string `json:"name" binding:"required"`
}

type UpdateOrganizationRequest struct {
	Name string `json:"name" binding:"required"`
}

type CreateProjectRequest struct {
	ID          string `json:"id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	// OrgID       string `json:"org_id" binding:"required"`
	// BillingID   string `json:"billing_id" binding:"required"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name"` // Use pointers to distinguish between empty and not provided
	Description *string `json:"description"`
}

type CreateResourceRequest struct {
	ID         string          `json:"id" binding:"required"`
	Name       string          `json:"name" binding:"required"`
	Type       string          `json:"type" binding:"required"` // e.g., "GraphDatabase"
	SettingsJSON json.RawMessage `json:"settings_json"`             // Initial settings as JSON
}

type UpdateResourceRequest struct {
	Name       *string         `json:"name"`
	SettingsJSON json.RawMessage `json:"settings_json"` // Send full JSON structure to update
}

// User model (simplified for identifying user from token)
type User struct {
	ID    string   `json:"id"`    // Subject from JWT
	Email string   `json:"email"` // Email from JWT
	Name  string   `json:"name"`  // Name from JWT
	Roles []string `json:"roles,omitempty"` // Roles derived from JWT or DB lookup (placeholder)
}

// RBAC Models

type Organization struct {
	OrgID                   string  `json:"org_id" db:"org_id"`
	Name                    string  `json:"name" db:"name"`
	StripeCustomerID        *string `json:"stripe_customer_id,omitempty" db:"stripe_customer_id"`
	StripeSubscriptionID    *string `json:"stripe_subscription_id,omitempty" db:"stripe_subscription_id"`
	SubscriptionStatus      string  `json:"subscription_status" db:"subscription_status"`
	SubscriptionPlan        string  `json:"subscription_plan" db:"subscription_plan"`
	BillingEmail            *string `json:"billing_email,omitempty" db:"billing_email"`
	CreatedAt               time.Time `json:"created_at" db:"created_at"`
	UpdatedAt               time.Time `json:"updated_at" db:"updated_at"`
}

type Role struct {
	RoleID      string    `json:"role_id" db:"role_id"`
	Name        string    `json:"name" db:"name"`
	DisplayName string    `json:"display_name" db:"display_name"`
	Description string    `json:"description" db:"description"`
	IsSystem    bool      `json:"is_system" db:"is_system"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type Permission struct {
	PermissionID string    `json:"permission_id" db:"permission_id"`
	ResourceType string    `json:"resource_type" db:"resource_type"`
	Action       string    `json:"action" db:"action"`
	Description  string    `json:"description" db:"description"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

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

// RoleAssignmentWithDetails includes populated user and role information
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
	InheritanceType        string `json:"inheritance_type"`         // "direct" or "inherited"
	InheritedFromScopeType string `json:"inherited_from_scope_type,omitempty"` // "organization" or "project"
	InheritedFromScopeID   string `json:"inherited_from_scope_id,omitempty"`   // ID of the parent scope
	InheritedFromName      string `json:"inherited_from_name,omitempty"`       // Name of the parent scope
}

// Permission check result
type UserPermission struct {
	UserID       string `json:"user_id"`
	ResourceType string `json:"resource_type"`
	Action       string `json:"action"`
	ScopeType    string `json:"scope_type"`
	ScopeID      string `json:"scope_id"`
	HasPermission bool  `json:"has_permission"`
}

// Billing Models

type BillingAccount struct {
	BillingAccountID       string    `json:"billing_account_id" db:"billing_account_id"`
	ScopeType              string    `json:"scope_type" db:"scope_type"` // "organization" or "project"
	ScopeID                string    `json:"scope_id" db:"scope_id"`
	StripeCustomerID       *string   `json:"stripe_customer_id,omitempty" db:"stripe_customer_id"`
	StripeSubscriptionID   *string   `json:"stripe_subscription_id,omitempty" db:"stripe_subscription_id"`
	SubscriptionStatus     string    `json:"subscription_status" db:"subscription_status"`
	SubscriptionPlan       string    `json:"subscription_plan" db:"subscription_plan"`
	BillingEmail           *string   `json:"billing_email,omitempty" db:"billing_email"`
	CreatedAt              time.Time `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time `json:"updated_at" db:"updated_at"`
}

// Billing API Request/Response Types

type CreateStripeCustomerRequest struct {
	Email       string `json:"email" binding:"required"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type CreateStripeSubscriptionRequest struct {
	PriceID         string `json:"price_id,omitempty"`
	PaymentMethodID string `json:"payment_method_id,omitempty"`
}

type UpdateBillingRequest struct {
	BillingEmail       *string `json:"billing_email"`
	SubscriptionPlan   *string `json:"subscription_plan"`
}

type BillingInfo struct {
	BillingAccount       BillingAccount `json:"billing_account"`
	StripeCustomerPortal *string        `json:"stripe_customer_portal,omitempty"`
	UpcomingInvoice      *StripeInvoice `json:"upcoming_invoice,omitempty"`
	PaymentMethods       []StripePaymentMethod `json:"payment_methods,omitempty"`
	SubscriptionItems    []StripeSubscriptionItem `json:"subscription_items,omitempty"`
	SubscriptionDetails  *StripeSubscriptionDetails `json:"subscription_details,omitempty"`
}

type StripeInvoice struct {
	ID             string  `json:"id"`
	AmountDue      int64   `json:"amount_due"`
	Currency       string  `json:"currency"`
	PeriodStart    int64   `json:"period_start"`
	PeriodEnd      int64   `json:"period_end"`
	Status         string  `json:"status"`
	HostedInvoiceURL *string `json:"hosted_invoice_url,omitempty"`
}

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

type StripeSubscriptionItem struct {
	ID       string `json:"id"`
	Quantity int64  `json:"quantity"`
	Price    *struct {
		ID            string `json:"id"`
		UnitAmount    int64  `json:"unit_amount"`
		Currency      string `json:"currency"`
		Recurring     *struct {
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

type StripeSubscriptionDetails struct {
	ID                 string `json:"id"`
	Status             string `json:"status"`
	CurrentPeriodStart int64  `json:"current_period_start"`
	CurrentPeriodEnd   int64  `json:"current_period_end"`
	CancelAtPeriodEnd  bool   `json:"cancel_at_period_end"`
}
