package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
)

type OrganizationService struct {
	rbacService *RBACService
}

func NewOrganizationService() *OrganizationService {
	return &OrganizationService{
		rbacService: NewRBACService(),
	}
}

// CreateOrganization creates a new organization and assigns the creator as owner
func (s *OrganizationService) CreateOrganization(ctx context.Context, name, ownerUserID string) (*models.Organization, error) {
	pool := db.GetDB()

	orgID := uuid.New().String()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Insert organization
	org := &models.Organization{
		OrgID: orgID,
		Name:  name,
	}

	err = tx.QueryRow(ctx, db.CreateOrganizationWithTimestampsQuery,
		org.OrgID, org.Name).Scan(&org.CreatedAt, &org.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create organization: %w", err)
	}

	// Assign owner role to the user
	err = s.rbacService.AssignRoleInTx(ctx, tx, ownerUserID, "Owner", "organization", orgID, ownerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to assign owner role: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return org, nil
}

// ListOrganizations returns organizations where the user has any permission
func (s *OrganizationService) ListOrganizations(ctx context.Context, userID string) ([]models.Organization, error) {
	pool := db.GetDB()

	// Query organizations where user has any role - this is much more efficient
	// than fetching all organizations and checking permissions one by one
	query := `
		SELECT DISTINCT o.org_id, o.name, o.created_at, o.updated_at
		FROM ktrlplane.organizations o
		JOIN ktrlplane.rbac_assignments ra ON ra.scope_id = o.org_id
		WHERE ra.user_id = $1 AND ra.scope_type = 'organization'
		ORDER BY o.name`

	rows, err := pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query organizations: %w", err)
	}
	defer rows.Close()

	var organizations []models.Organization
	for rows.Next() {
		var org models.Organization
		if err := rows.Scan(&org.OrgID, &org.Name, &org.CreatedAt, &org.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan organization: %w", err)
		}
		organizations = append(organizations, org)
	}

	return organizations, nil
}

// GetOrganization returns a specific organization if user has read access
func (s *OrganizationService) GetOrganization(ctx context.Context, orgID, userID string) (*models.Organization, error) {
	// Check read permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "read", "organization", orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to view organization")
	}

	// Get organization details
	pool := db.GetDB()
	rows, err := pool.Query(ctx, "SELECT org_id, name, created_at, updated_at FROM ktrlplane.organizations WHERE org_id = $1", orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch organization: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		var org models.Organization
		if err := rows.Scan(&org.OrgID, &org.Name, &org.CreatedAt, &org.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan organization: %w", err)
		}
		return &org, nil
	}

	return nil, fmt.Errorf("organization not found")
}

// UpdateOrganization updates an organization if user has write access
func (s *OrganizationService) UpdateOrganization(ctx context.Context, orgID, name, userID string) (*models.Organization, error) {
	// Check write permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "organization", orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to update organization")
	}

	// Update organization
	err = db.ExecQuery(ctx, "UPDATE ktrlplane.organizations SET name = $2, updated_at = NOW() WHERE org_id = $1", orgID, name)
	if err != nil {
		return nil, fmt.Errorf("failed to update organization: %w", err)
	}

	return s.GetOrganization(ctx, orgID, userID)
}

// DeleteOrganization deletes an organization if user has delete access
func (s *OrganizationService) DeleteOrganization(ctx context.Context, orgID, userID string) error {
	// Check delete permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "delete", "organization", orgID)
	if err != nil {
		return fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return fmt.Errorf("insufficient permissions to delete organization")
	}

	// Delete organization (cascades to projects, resources, role assignments)
	err = db.ExecQuery(ctx, "DELETE FROM ktrlplane.organizations WHERE org_id = $1", orgID)
	if err != nil {
		return fmt.Errorf("failed to delete organization: %w", err)
	}

	return nil
}
