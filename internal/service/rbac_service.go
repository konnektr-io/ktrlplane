package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RBACService struct{}

func NewRBACService() *RBACService {
	return &RBACService{}
}

// CreateOrganization creates a new organization
func (s *RBACService) CreateOrganization(ctx context.Context, name, ownerUserID string) (*models.Organization, error) {
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
	err = s.assignRoleInTx(ctx, tx, ownerUserID, "Owner", "organization", orgID, ownerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to assign owner role: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return org, nil
}

// CreateProject creates a new project within an organization
func (s *RBACService) CreateProject(ctx context.Context, orgID, name, description, ownerUserID string) (*models.Project, error) {
	pool := db.GetDB()

	projectID := uuid.New().String()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Insert project
	project := &models.Project{
		ProjectID:   projectID,
		OrgID:       &orgID,
		Name:        name,
		Description: description,
		Status:      "Active",
	}

	err = tx.QueryRow(ctx, db.CreateProjectWithTimestampsQuery,
		project.ProjectID, project.OrgID, project.Name, project.Description, project.Status).Scan(&project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	// Assign project owner role to the user
	err = s.assignRoleInTx(ctx, tx, ownerUserID, "Owner", "project", projectID, ownerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to assign project owner role: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return project, nil
}

// AssignRole assigns a role to a user for a specific scope
func (s *RBACService) AssignRole(ctx context.Context, userID, roleName, scopeType, scopeID, assignedBy string) error {
	pool := db.GetDB()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	err = s.assignRoleInTx(ctx, tx, userID, roleName, scopeType, scopeID, assignedBy)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// assignRoleInTx assigns a role within a transaction
func (s *RBACService) assignRoleInTx(ctx context.Context, tx pgx.Tx, userID, roleName, scopeType, scopeID, assignedBy string) error {
	// Get role ID
	var roleID string
	err := tx.QueryRow(ctx, db.GetRoleIDByNameQuery, roleName).Scan(&roleID)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Insert role assignment (ON CONFLICT DO NOTHING to avoid duplicates)
	_, err = tx.Exec(ctx, db.AssignRoleWithTransactionQuery,
		uuid.New().String(), userID, roleID, scopeType, scopeID, assignedBy)
	if err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	return nil
}

// CheckPermission checks if a user has a specific permission on a resource
func (s *RBACService) CheckPermission(ctx context.Context, userID, action, scopeType, scopeID string) (bool, error) {
	pool := db.GetDB()

	// This query checks permission inheritance:
	// 1. Direct assignment on the specific scope
	// 2. Inherited from parent scopes (organization -> project -> resource)

	var hasPermission bool
	err := pool.QueryRow(ctx, db.CheckPermissionWithInheritanceQuery, userID, action, scopeType, scopeID).Scan(&hasPermission)
	if err != nil {
		return false, fmt.Errorf("failed to check permission: %w", err)
	}

	return hasPermission, nil
}

// GetUserRoles returns all roles assigned to a user across all scopes
func (s *RBACService) GetUserRoles(ctx context.Context, userID string) ([]models.RoleAssignment, error) {
	pool := db.GetDB()

	rows, err := pool.Query(ctx, db.GetUserRolesQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}
	defer rows.Close()

	var assignments []models.RoleAssignment
	for rows.Next() {
		var assignment models.RoleAssignment
		err := rows.Scan(&assignment.AssignmentID, &assignment.UserID, &assignment.RoleID,
			&assignment.ScopeType, &assignment.ScopeID, &assignment.AssignedBy,
			&assignment.CreatedAt, &assignment.ExpiresAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role assignment: %w", err)
		}
		assignments = append(assignments, assignment)
	}

	return assignments, nil
}

// GetOrganizationsForUser returns organizations where user has any role
func (s *RBACService) GetOrganizationsForUser(ctx context.Context, userID string) ([]models.Organization, error) {
	pool := db.GetDB()

	rows, err := pool.Query(ctx, db.GetOrganizationsForUserAdvancedQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user organizations: %w", err)
	}
	defer rows.Close()

	var organizations []models.Organization
	for rows.Next() {
		var org models.Organization
		err := rows.Scan(&org.OrgID, &org.Name, &org.CreatedAt, &org.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan organization: %w", err)
		}
		organizations = append(organizations, org)
	}

	return organizations, nil
}
