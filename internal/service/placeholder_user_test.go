package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/utils"
	"testing"

	"ktrlplane/internal/config"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	// Skip DB init if in short mode
	if os.Getenv("GO_TEST_SHORT") == "true" {
		os.Exit(m.Run())
	}

	// Initialize DB for integration tests using env vars
	port, _ := strconv.Atoi(os.Getenv("DB_PORT"))
	if port == 0 {
		port = 5432
	}

	cfg := config.DatabaseConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     port,
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		SSLMode:  "disable",
	}

	// Only attempt init if we have a host (implies integration test environment)
	if cfg.Host != "" {
		if err := db.InitDB(cfg); err != nil {
			fmt.Printf("Failed to initialize database for tests: %v\n", err)
			os.Exit(1)
		}
	}

	code := m.Run()

	if cfg.Host != "" {
		db.CloseDB()
	}

	os.Exit(code)
}

// TestPlaceholderUserInvitationFlow tests the complete invitation flow:
// 1. Role is assigned to non-existent user (email)
// 2. Placeholder user is created
// 3. Real user logs in via social auth
// 4. Role assignments are transferred from placeholder to real user
// 5. Placeholder user is deleted
func TestPlaceholderUserInvitationFlow(t *testing.T) {
	// Skip if not in integration test mode
	if testing.Short() || os.Getenv("DB_HOST") == "" {
		t.Skip("Skipping integration test")
	}

	ctx := context.Background()
	rbacService := NewRBACService()

	// Test data
	invitedEmail := "invited.user@example.com"
	realUserID := "auth0|" + uuid.New().String() // Simulates Auth0 user ID
	organizationID := uuid.New().String()
	assignerID := "auth0|test-assigner"
	roleID := "10000000-0001-0000-0000-000000000003" // Viewer role

	// Clean up at the end
	defer func() {
		pool := db.GetDB()
		// Clean up any remaining data
		_, _ = pool.Exec(ctx, "DELETE FROM ktrlplane.role_assignments WHERE user_id = $1 OR user_id = $2", invitedEmail, realUserID)
		_, _ = pool.Exec(ctx, "DELETE FROM ktrlplane.users WHERE user_id = $1 OR user_id = $2", invitedEmail, realUserID)
		_, _ = pool.Exec(ctx, "DELETE FROM ktrlplane.users WHERE user_id = $1", assignerID)
		_, _ = pool.Exec(ctx, "DELETE FROM ktrlplane.organizations WHERE org_id = $1", organizationID)
	}()

	// Setup: Create assigner user and organization
	pool := db.GetDB()
	_, err := pool.Exec(ctx, db.CreateUserQuery, assignerID, "assigner@example.com", "Assigner")
	require.NoError(t, err, "Failed to create assigner user")

	_, err = pool.Exec(ctx, "INSERT INTO ktrlplane.organizations (org_id, name) VALUES ($1, $2)", organizationID, "Test Org")
	require.NoError(t, err, "Failed to create test organization")

	// Step 1: Validate that email is valid
	t.Run("ValidateEmailFormat", func(t *testing.T) {
		assert.True(t, utils.IsValidEmail(invitedEmail), "Email should be valid")
		assert.False(t, utils.IsValidEmail("not-an-email"), "Invalid email should return false")
	})

	// Step 2: Assign role to non-existent user (invitation scenario)
	t.Run("AssignRoleToNonExistentUser", func(t *testing.T) {
		err := rbacService.AssignRole(ctx, invitedEmail, roleID, "organization", organizationID, assignerID)
		require.NoError(t, err, "Should successfully assign role to email (creating placeholder)")

		// Verify placeholder user was created
		var placeholderUserID, placeholderEmail string
		err = pool.QueryRow(ctx, db.FindPlaceholderUserByEmailQuery, invitedEmail).Scan(&placeholderUserID, &placeholderEmail, new(string))
		require.NoError(t, err, "Placeholder user should exist")
		assert.Equal(t, invitedEmail, placeholderUserID, "Placeholder user_id should be the email")
		assert.Equal(t, invitedEmail, placeholderEmail, "Placeholder email should match")
	})

	// Step 3: Verify role assignment exists for placeholder
	t.Run("VerifyPlaceholderRoleAssignment", func(t *testing.T) {
		assignments, err := rbacService.GetUserRoles(ctx, invitedEmail)
		require.NoError(t, err, "Should get user roles")
		require.Len(t, assignments, 1, "Should have exactly one role assignment")
		assert.Equal(t, roleID, assignments[0].RoleID, "Role should match")
		assert.Equal(t, organizationID, assignments[0].ScopeID, "Scope should match")
	})

	// Step 4: Simulate real user login (ensureUserExists is called by auth middleware)
	t.Run("RealUserLoginTransfersRoles", func(t *testing.T) {
		// Import auth package function (simulating what middleware does)
		// We'll directly call the database operations that ensureUserExists would do

		// First check for placeholder
		var placeholderUserID, placeholderEmail, placeholderName string
		placeholderRows, err := pool.Query(ctx, db.FindPlaceholderUserByEmailQuery, invitedEmail)
		require.NoError(t, err)
		defer placeholderRows.Close()

		require.True(t, placeholderRows.Next(), "Placeholder should exist")
		err = placeholderRows.Scan(&placeholderUserID, &placeholderEmail, &placeholderName)
		require.NoError(t, err)
		placeholderRows.Close()

		// Start transaction for transfer
		tx, err := pool.Begin(ctx)
		require.NoError(t, err)
		defer func() { _ = tx.Rollback(ctx) }()

		// Create real user
		_, err = tx.Exec(ctx, db.CreateUserQuery, realUserID, invitedEmail, "Real User")
		require.NoError(t, err, "Should create real user")

		// Transfer role assignments
		result, err := tx.Exec(ctx, db.TransferRoleAssignmentsQuery, placeholderUserID, realUserID)
		require.NoError(t, err, "Should transfer role assignments")
		rowsAffected := result.RowsAffected()
		assert.Equal(t, int64(1), rowsAffected, "Should have transferred 1 role assignment")

		// Delete placeholder
		_, err = tx.Exec(ctx, db.DeletePlaceholderUserQuery, placeholderUserID)
		require.NoError(t, err, "Should delete placeholder user")

		// Commit
		err = tx.Commit(ctx)
		require.NoError(t, err, "Transaction should commit")
	})

	// Step 5: Verify role assignment now belongs to real user
	t.Run("VerifyRoleTransferredToRealUser", func(t *testing.T) {
		assignments, err := rbacService.GetUserRoles(ctx, realUserID)
		require.NoError(t, err, "Should get user roles")
		require.Len(t, assignments, 1, "Real user should have exactly one role assignment")
		assert.Equal(t, roleID, assignments[0].RoleID, "Role should match")
		assert.Equal(t, organizationID, assignments[0].ScopeID, "Scope should match")

		// Verify placeholder has no assignments
		placeholderAssignments, err := rbacService.GetUserRoles(ctx, invitedEmail)
		require.NoError(t, err, "Should query placeholder roles")
		assert.Len(t, placeholderAssignments, 0, "Placeholder should have no role assignments")
	})

	// Step 6: Verify placeholder user is deleted
	t.Run("VerifyPlaceholderDeleted", func(t *testing.T) {
		var placeholderUserID string
		err := pool.QueryRow(ctx, db.GetUserByIDQuery, invitedEmail).Scan(&placeholderUserID, new(string), new(string))
		assert.Error(t, err, "Placeholder user should not exist")
	})

	// Step 7: Verify real user exists
	t.Run("VerifyRealUserExists", func(t *testing.T) {
		var existingUserID, existingEmail string
		err := pool.QueryRow(ctx, db.GetUserByIDQuery, realUserID).Scan(&existingUserID, &existingEmail, new(string))
		require.NoError(t, err, "Real user should exist")
		assert.Equal(t, realUserID, existingUserID, "User ID should match")
		assert.Equal(t, invitedEmail, existingEmail, "Email should match")
	})
}

// TestAssignRoleToInvalidEmail tests that assigning a role to an invalid identifier fails
func TestAssignRoleToInvalidEmail(t *testing.T) {
	// Skip if not in integration test mode
	if testing.Short() || os.Getenv("DB_HOST") == "" {
		t.Skip("Skipping integration test")
	}

	ctx := context.Background()
	rbacService := NewRBACService()

	invalidUserID := "not-a-valid-email-or-user-id"
	organizationID := uuid.New().String()
	assignerID := "auth0|test-assigner"
	roleID := "10000000-0001-0000-0000-000000000003"

	// Clean up
	defer func() {
		pool := db.GetDB()
		pool.Exec(ctx, "DELETE FROM ktrlplane.users WHERE user_id = $1", assignerID)
		pool.Exec(ctx, "DELETE FROM ktrlplane.organizations WHERE org_id = $1", organizationID)
	}()

	// Setup
	pool := db.GetDB()
	_, err := pool.Exec(ctx, db.CreateUserQuery, assignerID, "assigner@example.com", "Assigner")
	require.NoError(t, err)

	_, err = pool.Exec(ctx, "INSERT INTO ktrlplane.organizations (org_id, name) VALUES ($1, $2)", organizationID, "Test Org")
	require.NoError(t, err)

	// Attempt to assign role to invalid user ID
	err = rbacService.AssignRole(ctx, invalidUserID, roleID, "organization", organizationID, assignerID)
	assert.Error(t, err, "Should fail to assign role to invalid user ID")
	assert.Contains(t, err.Error(), "does not exist and is not a valid email", "Error should mention invalid email")
}

// TestAssignRoleToExistingUser tests that assigning a role to an existing user works normally
func TestAssignRoleToExistingUser(t *testing.T) {
	// Skip if not in integration test mode
	if testing.Short() || os.Getenv("DB_HOST") == "" {
		t.Skip("Skipping integration test")
	}

	ctx := context.Background()
	rbacService := NewRBACService()

	existingUserID := "auth0|existing-user"
	organizationID := uuid.New().String()
	assignerID := "auth0|test-assigner"
	roleID := "10000000-0001-0000-0000-000000000003"

	// Clean up
	defer func() {
		pool := db.GetDB()
		pool.Exec(ctx, "DELETE FROM ktrlplane.role_assignments WHERE user_id = $1", existingUserID)
		pool.Exec(ctx, "DELETE FROM ktrlplane.users WHERE user_id = $1 OR user_id = $2", existingUserID, assignerID)
		pool.Exec(ctx, "DELETE FROM ktrlplane.organizations WHERE org_id = $1", organizationID)
	}()

	// Setup: Create existing user
	pool := db.GetDB()
	_, err := pool.Exec(ctx, db.CreateUserQuery, existingUserID, "existing@example.com", "Existing User")
	require.NoError(t, err)

	_, err = pool.Exec(ctx, db.CreateUserQuery, assignerID, "assigner@example.com", "Assigner")
	require.NoError(t, err)

	_, err = pool.Exec(ctx, "INSERT INTO ktrlplane.organizations (org_id, name) VALUES ($1, $2)", organizationID, "Test Org")
	require.NoError(t, err)

	// Assign role to existing user
	err = rbacService.AssignRole(ctx, existingUserID, roleID, "organization", organizationID, assignerID)
	require.NoError(t, err, "Should successfully assign role to existing user")

	// Verify assignment
	assignments, err := rbacService.GetUserRoles(ctx, existingUserID)
	require.NoError(t, err)
	require.Len(t, assignments, 1, "Should have exactly one role assignment")
	assert.Equal(t, roleID, assignments[0].RoleID)
}
