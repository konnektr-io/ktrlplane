package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// RBACService handles role-based access control operations.
// Intentionally empty: all methods are stateless and operate on the database.
type RBACService struct{}

// NewRBACService creates a new RBACService.
func NewRBACService() *RBACService {
	return &RBACService{}
}

// ListRoles returns all roles in the system
func (s *RBACService) ListRoles(ctx context.Context) ([]models.Role, error) {
	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.GetAllRolesQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to list roles: %w", err)
	}
	defer rows.Close()

	roles := make([]models.Role, 0)
	for rows.Next() {
		var role models.Role
		err := rows.Scan(
			&role.RoleID,
			&role.Name,
			&role.DisplayName,
			&role.Description,
			&role.IsSystem,
			&role.CreatedAt,
			&role.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// ListPermissionsForRole returns all permissions for a specific role
func (s *RBACService) ListPermissionsForRole(ctx context.Context, roleID string) ([]models.Permission, error) {
	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.GetPermissionsForRoleQuery, roleID)
	if err != nil {
		return nil, fmt.Errorf("failed to list permissions for role: %w", err)
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var perm models.Permission
		err := rows.Scan(
			&perm.PermissionID,
			&perm.ResourceType,
			&perm.Action,
			&perm.Description,
			&perm.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}
	return permissions, nil
}

// AssignRole assigns a role to a user for a specific scope
func (s *RBACService) AssignRole(ctx context.Context, userID, roleID, scopeType, scopeID, assignedBy string) error {
	pool := db.GetDB()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			fmt.Printf("[RBACService] transaction rollback error: %v\n", rollbackErr)
		}
	}()

	err = s.AssignRoleInTx(ctx, tx, userID, roleID, scopeType, scopeID, assignedBy)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// AssignRoleInTx assigns a role within a transaction (exported for use by other services)
func (s *RBACService) AssignRoleInTx(ctx context.Context, tx pgx.Tx, userID, roleID, scopeType, scopeID, assignedBy string) error {
	// Insert role assignment (ON CONFLICT DO NOTHING to avoid duplicates)
	_, err := tx.Exec(ctx, db.AssignRoleWithTransactionQuery,
		uuid.New().String(), userID, roleID, scopeType, scopeID, assignedBy)
	if err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	return nil
}

// ListPermissions returns all actions (permissions) the user has for a given scope, considering inheritance
func (s *RBACService) ListPermissions(ctx context.Context, userID, scopeType, scopeID string) ([]string, error) {
	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.ListPermissionsWithInheritanceQuery, userID, scopeType, scopeID)
	if err != nil {
		return nil, fmt.Errorf("failed to list permissions: %w", err)
	}
	defer rows.Close()

	var permissions []string
	for rows.Next() {
		var action string
		if err := rows.Scan(&action); err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, action)
	}
	return permissions, nil
}

// CheckPermission checks if a user has a specific permission on a resource
func (s *RBACService) CheckPermission(ctx context.Context, userID, action, scopeType, scopeID string) (bool, error) {
	pool := db.GetDB()

	// This query checks permission inheritance:
	// 1. Direct assignment on the specific scope
	// 2. Inherited from parent scopes (organization -> project -> resource)

	var hasPermission bool
	err := pool.QueryRow(ctx, db.CheckPermissionWithInheritanceQuery, userID, scopeType, scopeID, action).Scan(&hasPermission)
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

	assignments := make([]models.RoleAssignment, 0)
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

// GetRoleAssignmentsForScope returns all role assignments for a specific scope (with user and role data populated)
func (s *RBACService) GetRoleAssignmentsForScope(ctx context.Context, scopeType, scopeID string) ([]models.RoleAssignmentWithDetails, error) {
	pool := db.GetDB()

	rows, err := pool.Query(ctx, db.GetRoleAssignmentsWithDetailsQuery, scopeType, scopeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get role assignments for scope: %w", err)
	}
	defer rows.Close()

	assignments := make([]models.RoleAssignmentWithDetails, 0)
	for rows.Next() {
		var assignment models.RoleAssignmentWithDetails
		var userEmail, userName string
		err := rows.Scan(
			&assignment.AssignmentID, &assignment.UserID, &assignment.RoleID, &assignment.ScopeType, &assignment.ScopeID,
			&assignment.AssignedBy, &assignment.CreatedAt, &assignment.ExpiresAt,
			&assignment.Role.Name, &assignment.Role.DisplayName, &assignment.Role.Description, &assignment.Role.IsSystem,
			&userEmail, &userName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role assignment: %w", err)
		}

		// Set role ID for the embedded role
		assignment.Role.RoleID = assignment.RoleID
		assignment.Role.CreatedAt = assignment.CreatedAt // Approximate
		assignment.Role.UpdatedAt = assignment.CreatedAt // Approximate

		// Populate user details with real data from database
		assignment.User.ID = assignment.UserID
		assignment.User.Email = userEmail
		assignment.User.Name = userName

		assignments = append(assignments, assignment)
	}

	return assignments, nil
}

// GetRoleAssignmentsWithInheritance returns all role assignments for a specific scope including inherited assignments from parent scopes
func (s *RBACService) GetRoleAssignmentsWithInheritance(ctx context.Context, scopeType, scopeID string) ([]models.RoleAssignmentWithDetails, error) {
	pool := db.GetDB()

	rows, err := pool.Query(ctx, db.GetRoleAssignmentsWithInheritanceQuery, scopeType, scopeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get role assignments with inheritance for scope: %w", err)
	}
	defer rows.Close()

	assignments := make([]models.RoleAssignmentWithDetails, 0)
	for rows.Next() {
		var assignment models.RoleAssignmentWithDetails
		var userEmail, userName string
		err := rows.Scan(
			&assignment.AssignmentID, &assignment.UserID, &assignment.RoleID, &assignment.ScopeType, &assignment.ScopeID,
			&assignment.AssignedBy, &assignment.CreatedAt, &assignment.ExpiresAt,
			&assignment.Role.Name, &assignment.Role.DisplayName, &assignment.Role.Description, &assignment.Role.IsSystem,
			&userEmail, &userName,
			&assignment.InheritanceType, &assignment.InheritedFromScopeType, &assignment.InheritedFromScopeID, &assignment.InheritedFromName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role assignment with inheritance: %w", err)
		}

		// Set role ID for the embedded role
		assignment.Role.RoleID = assignment.RoleID
		assignment.Role.CreatedAt = assignment.CreatedAt // Approximate
		assignment.Role.UpdatedAt = assignment.CreatedAt // Approximate

		// Populate user details with real data from database
		assignment.User.ID = assignment.UserID
		assignment.User.Email = userEmail
		assignment.User.Name = userName

		assignments = append(assignments, assignment)
	}

	return assignments, nil
}

// SearchUsers returns users matching the query string (by email or name)
func (s *RBACService) SearchUsers(ctx context.Context, query string) ([]models.User, error) {
	pool := db.GetDB()
	likeQuery := "%" + query + "%"
	rows, err := pool.Query(ctx, db.SearchUsersQuery, likeQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Email, &user.Name); err == nil {
			users = append(users, user)
		}
	}
	return users, nil
}

// DeleteRoleAssignment deletes a role assignment by assignment ID (unique)
func (s *RBACService) DeleteRoleAssignment(ctx context.Context, assignmentID string) error {
	pool := db.GetDB()
	query := db.DeleteRoleAssignmentQuery
	cmdTag, err := pool.Exec(ctx, query, assignmentID)
	if err != nil {
		return fmt.Errorf("failed to delete role assignment %s: %w", assignmentID, err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("role assignment %s not found", assignmentID)
	}
	return nil
}
