package models

import (
	"encoding/json"
	"time"
)

// Using map[string]interface{} for flexibility with AGE properties initially.
// Consider defining more specific structs if properties are stable.

type Project struct {
	ProjectID   string    `json:"project_id" agtype:"project_id"`
	OrgID       *string   `json:"org_id" agtype:"org_id" db:"org_id"`
	Name        string    `json:"name" agtype:"name"`
	Description string    `json:"description,omitempty" agtype:"description"`
	Status      string    `json:"status" agtype:"status"`
	CreatedAt   time.Time `json:"created_at" agtype:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" agtype:"updated_at"`
}

type Resource struct {
	ResourceID   string          `json:"resource_id" agtype:"resource_id"`
	ProjectID    string          `json:"project_id"` // Added for context, not directly in node usually
	Name         string          `json:"name" agtype:"name"`
	Type         string          `json:"type" agtype:"type"` // e.g., "GraphDatabase", "Flow"
	Status       string          `json:"status" agtype:"status"`
	HelmValues   json.RawMessage `json:"helm_values" agtype:"helm_values"` // Store as raw JSON
	CreatedAt    time.Time       `json:"created_at" agtype:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at" agtype:"updated_at"`
	ErrorMessage *string         `json:"error_message,omitempty" agtype:"error_message"`
	// Specific fields for resource types might be present but accessed via HelmValues
	AccessURL *string `json:"access_url,omitempty" agtype:"access_url"` // Example specific field
}

// --- API Request/Response Payloads ---

type CreateOrganizationRequest struct {
	Name string `json:"name" binding:"required"`
}

type UpdateOrganizationRequest struct {
	Name string `json:"name" binding:"required"`
}

type CreateProjectRequest struct {
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
	Name       string          `json:"name" binding:"required"`
	Type       string          `json:"type" binding:"required"` // e.g., "GraphDatabase"
	HelmValues json.RawMessage `json:"helm_values"`             // Initial Helm values as JSON
}

type UpdateResourceRequest struct {
	Name       *string         `json:"name"`
	HelmValues json.RawMessage `json:"helm_values"` // Send full JSON structure to update
}

// User model (simplified for identifying user from token)
type User struct {
	ID    string   `json:"id"`    // Subject from JWT
	Email string   `json:"email"` // Email from JWT
	Name  string   `json:"name"`  // Name from JWT
	Roles []string `json:"roles"` // Roles derived from JWT or DB lookup (placeholder)
}

// RBAC Models

type Organization struct {
	OrgID     string    `json:"org_id" db:"org_id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
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
