package models

import (
	"encoding/json"
	"time"
)

// Using map[string]interface{} for flexibility with AGE properties initially.
// Consider defining more specific structs if properties are stable.

type Project struct {
	ProjectID   string    `json:"project_id" agtype:"project_id"`
	Name        string    `json:"name" agtype:"name"`
	Description string    `json:"description,omitempty" agtype:"description"`
	Status      string    `json:"status" agtype:"status"`
	CreatedAt   time.Time `json:"created_at" agtype:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" agtype:"updated_at"`
	// Add OrgID, BillingID if linking relationships
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
	ErrorMessage string          `json:"error_message,omitempty" agtype:"error_message"`
	// Specific fields for resource types might be present but accessed via HelmValues
	AccessURL string `json:"access_url,omitempty" agtype:"access_url"` // Example specific field
}

// --- API Request/Response Payloads ---

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
	ID    string   // Subject from JWT
	Email string   // Email from JWT
	Roles []string // Roles derived from JWT or DB lookup (placeholder)
}
