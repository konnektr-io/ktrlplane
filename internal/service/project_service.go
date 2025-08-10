package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
)

type ProjectService struct {
	rbacService *RBACService
	orgService  *OrganizationService
}

func NewProjectService() *ProjectService {
	return &ProjectService{
		rbacService: NewRBACService(),
		orgService:  NewOrganizationService(),
	}
}

// CreateProject creates a new project within an organization
func (s *ProjectService) CreateProject(ctx context.Context, req models.CreateProjectRequest, userID string) (*models.Project, error) {
	// For self-service, we need to either:
	// 1. Create a new organization if user doesn't have one
	// 2. Create project in user's existing organization with write access
	
	// First, check if user has any organizations
	orgs, err := s.rbacService.GetOrganizationsForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user organizations: %w", err)
	}
	
	var orgID string
	if len(orgs) == 0 {
		// Self-service: Create new organization for the user
		defaultOrgName := fmt.Sprintf("%s's Organization", userID) // TODO: use user's name when available
		org, err := s.orgService.CreateOrganization(ctx, defaultOrgName, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to create organization: %w", err)
		}
		orgID = org.OrgID
	} else {
		// Find an organization where user has write access
		for _, org := range orgs {
			hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "organization", org.OrgID)
			if err != nil {
				continue
			}
			if hasPermission {
				orgID = org.OrgID
				break
			}
		}
		
		if orgID == "" {
			return nil, fmt.Errorf("no write access to any organization")
		}
	}
	
	// Create project
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
		Name:        req.Name,
		Description: req.Description,
		Status:      "Active",
	}

	err = tx.QueryRow(ctx, db.CreateProjectWithTimestampsQuery,
		project.ProjectID, project.OrgID, project.Name, project.Description, project.Status).Scan(&project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	// Assign project owner role to the user
	err = s.rbacService.AssignRoleInTx(ctx, tx, userID, "Owner", "project", projectID, userID)
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
		if err := rows.Scan(&project.ProjectID, &project.OrgID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		return &project, nil
	}

	return nil, fmt.Errorf("project not found: %s", projectID)
}

// ListProjects returns projects the user has read access to
func (s *ProjectService) ListProjects(ctx context.Context, userID string) ([]models.Project, error) {
	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.ListProjectsQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}
	defer rows.Close()

	var allProjects []models.Project
	for rows.Next() {
		var project models.Project
		if err := rows.Scan(&project.ProjectID, &project.OrgID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		allProjects = append(allProjects, project)
	}

	// Filter projects based on user permissions
	var filteredProjects []models.Project
	for _, project := range allProjects {
		hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "read", "project", project.ProjectID)
		if err != nil {
			continue // Skip on error, could log this
		}
		if hasPermission {
			filteredProjects = append(filteredProjects, project)
		}
	}

	return filteredProjects, nil
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

	err = db.ExecQuery(ctx, db.UpdateProjectQuery, projectID, req.Name, req.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return s.GetProjectByID(ctx, projectID, userID)
}

// DeleteProject deletes a project if user has delete access
func (s *ProjectService) DeleteProject(ctx context.Context, projectID, userID string) error {
	// Check delete permission
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "delete", "project", projectID)
	if err != nil {
		return fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return fmt.Errorf("insufficient permissions to delete project")
	}

	return db.ExecQuery(ctx, db.DeleteProjectQuery, projectID)
}
