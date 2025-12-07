package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/config"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"
	"ktrlplane/internal/utils"

	"github.com/stripe/stripe-go/v82/subscription"
)

// ProjectService handles project-related operations.
type ProjectService struct {
	rbacService *RBACService
	orgService  *OrganizationService
	config      *config.Config
}

// NewProjectService creates a new ProjectService.
func NewProjectService(cfg *config.Config) *ProjectService {
	return &ProjectService{
		rbacService: NewRBACService(),
		orgService:  NewOrganizationService(),
		config:      cfg,
	}
}

// CreateProject creates a new project within an organization
func (s *ProjectService) CreateProject(ctx context.Context, req models.CreateProjectRequest, userID string) (*models.Project, error) {
	// Validate the provided ID
	if err := utils.ValidateDNSID(req.ID); err != nil {
		return nil, fmt.Errorf("invalid project ID: %w", err)
	}

	// Allow org_id to be optional. If provided, use it; if not, allow project without org.
	var orgID *string
	if req.OrgID != nil && *req.OrgID != "" {
		orgID = req.OrgID
	} else {
		orgID = nil
	}

	// Create project
	pool := db.GetDB()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			// Log rollback error but don't override the main error
			fmt.Printf("[ProjectService] transaction rollback error: %v\n", rollbackErr)
		}
	}()

	// Insert project
	project := &models.Project{
		ProjectID:   req.ID,
		OrgID:       orgID,
		Name:        req.Name,
		Status:      "Active",
	}

	err = tx.QueryRow(ctx, db.CreateProjectWithTimestampsQuery,
		project.ProjectID, project.OrgID, project.Name, project.Status).Scan(&project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	// Assign project owner role (10000000-0001-0000-0000-000000000001) to the user
	err = s.rbacService.AssignRoleInTx(ctx, tx, userID, "10000000-0001-0000-0000-000000000001", "project", req.ID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to assign project owner role: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return project, nil
}

// GetProjectByID returns a project if user has read access
func (s *ProjectService) GetProjectByID(ctx context.Context, projectID, userID string) (*models.Project, error) {
	// Check read permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "read", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to view project")
	}

	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.GetProjectByIDQuery, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch project: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		var project models.Project
		if err := rows.Scan(&project.ProjectID, &project.OrgID, &project.Name, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		return &project, nil
	}

	return nil, fmt.Errorf("project not found: %s", projectID)
}

// ListProjects returns projects the user has access to (either directly or through organization access)
func (s *ProjectService) ListProjects(ctx context.Context, userID string) ([]models.Project, error) {
	pool := db.GetDB()

	rows, err := pool.Query(ctx, db.ListProjectsForUserQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query projects: %w", err)
	}
	defer rows.Close()

	projects := make([]models.Project, 0)
	for rows.Next() {
		var project models.Project
		if err := rows.Scan(&project.ProjectID, &project.OrgID, &project.Name, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		projects = append(projects, project)
	}

	return projects, nil
}

// UpdateProject updates a project if user has write access
func (s *ProjectService) UpdateProject(ctx context.Context, projectID string, req models.UpdateProjectRequest, userID string) (*models.Project, error) {
	// Check write permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to update project")
	}

	err = db.ExecQuery(ctx, db.UpdateProjectQuery, projectID, req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return s.GetProjectByID(ctx, projectID, userID)
}

// DeleteProject deletes a project if user has delete access
// This also cancels any associated Stripe subscription and removes the billing account
func (s *ProjectService) DeleteProject(ctx context.Context, projectID, userID string) error {
	// Check delete permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "delete", "project", projectID)
	if err != nil {
		return fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return fmt.Errorf("insufficient permissions to delete project")
	}

	// Cancel Stripe subscription and clean up billing account before deleting project
	billingSvc := NewBillingService(s.config)
	billingAccount, err := billingSvc.GetBillingAccount("project", projectID)
	if err == nil && billingAccount != nil {
		// Cancel Stripe subscription immediately (not at period end)
		if billingAccount.StripeSubscriptionID != nil && *billingAccount.StripeSubscriptionID != "" {
			_, err := subscription.Cancel(*billingAccount.StripeSubscriptionID, nil)
			if err != nil {
				// Log error but continue with deletion to avoid orphaned database records
				fmt.Printf("[ProjectService] Failed to cancel Stripe subscription %s: %v\n", *billingAccount.StripeSubscriptionID, err)
			}
		}

		// Delete billing account record
		deleteQuery := `DELETE FROM ktrlplane.billing_accounts WHERE scope_type = 'project' AND scope_id = $1`
		err = db.ExecQuery(ctx, deleteQuery, projectID)
		if err != nil {
			// Log error but continue with project deletion
			fmt.Printf("[ProjectService] Failed to delete billing account for project %s: %v\n", projectID, err)
		}
	}

	// Delete the project (this will cascade delete resources, role assignments, etc.)
	return db.ExecQuery(ctx, db.DeleteProjectQuery, projectID)
}
