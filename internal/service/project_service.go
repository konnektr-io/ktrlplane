package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"
)

type ProjectService struct{
	rbacService *RBACService
}

func NewProjectService() *ProjectService {
	return &ProjectService{
		rbacService: NewRBACService(),
	}
}

// CreateProject with self-service organization creation
func (s *ProjectService) CreateProject(ctx context.Context, req models.CreateProjectRequest, userID string) (*models.Project, error) {
	// For self-service, we need to either:
	// 1. Create a new organization if user doesn't have one
	// 2. Create project in user's existing organization
	
	// First, check if user has any organizations
	orgs, err := s.rbacService.GetOrganizationsForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user organizations: %w", err)
	}
	
	var orgID string
	if len(orgs) == 0 {
		// Self-service: Create new organization for the user
		defaultOrgName := fmt.Sprintf("%s's Organization", userID) // TODO: use user's name when available
		org, err := s.rbacService.CreateOrganization(ctx, defaultOrgName, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to create organization: %w", err)
		}
		orgID = org.OrgID
	} else {
		// Use the first organization (in future, we might let user choose)
		orgID = orgs[0].OrgID
	}
	
	// Create project using RBAC service
	project, err := s.rbacService.CreateProject(ctx, orgID, req.Name, req.Description, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}
	
	return project, nil
}

func (s *ProjectService) GetProjectByID(ctx context.Context, projectID string) (*models.Project, error) {
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

func (s *ProjectService) ListProjects(ctx context.Context) ([]models.Project, error) {
	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.ListProjectsQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}
	defer rows.Close()

	projects := make([]models.Project, 0)
	for rows.Next() {
		var project models.Project
		if err := rows.Scan(&project.ProjectID, &project.OrgID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		projects = append(projects, project)
	}

	return projects, nil
}

func (s *ProjectService) UpdateProject(ctx context.Context, projectID string, req models.UpdateProjectRequest) (*models.Project, error) {
	err := db.ExecQuery(ctx, db.UpdateProjectQuery, projectID, req.Name, req.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return s.GetProjectByID(ctx, projectID)
}

func (s *ProjectService) DeleteProject(ctx context.Context, projectID string) error {
	return db.ExecQuery(ctx, db.DeleteProjectQuery, projectID)
}

// Placeholder for RBAC related service methods
// func (s *ProjectService) ListProjectMembers(ctx context.Context, projectID string) ([]models.Member, error)
// func (s *ProjectService) AddProjectMember(ctx context.Context, projectID string, userID string, role string) error
// func (s *ProjectService) RemoveProjectMember(ctx context.Context, projectID string, userID string) error
