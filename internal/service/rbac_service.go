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

// AssignRole assigns a role to a user for a specific scope
func (s *RBACService) AssignRole(ctx context.Context, userID, roleName, scopeType, scopeID, assignedBy string) error {
	pool := db.GetDB()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	err = s.AssignRoleInTx(ctx, tx, userID, roleName, scopeType, scopeID, assignedBy)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// AssignRoleInTx assigns a role within a transaction (exported for use by other services)
func (s *RBACService) AssignRoleInTx(ctx context.Context, tx pgx.Tx, userID, roleName, scopeType, scopeID, assignedBy string) error {
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
