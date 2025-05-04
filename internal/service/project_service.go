package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
)

type ProjectService struct{}

func NewProjectService() *ProjectService {
	return &ProjectService{}
}

func (s *ProjectService) CreateProject(ctx context.Context, req models.CreateProjectRequest) (*models.Project, error) {
	projectID := uuid.New().String() // Generate unique ID

	err := db.ExecQuery(ctx, db.CreateProjectQuery, projectID, req.Name, req.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	// Fetch the created project to return its full details
	// Alternatively, modify CreateProjectQuery to return properties(p)
	createdProject, err := s.GetProjectByID(ctx, projectID)
	if err != nil {
		// Log error, but might proceed if creation itself didn't error
		fmt.Printf("Warning: failed to fetch newly created project %s details: %v\n", projectID, err)
		// Return a minimal representation if fetch fails
		return &models.Project{
			ProjectID:   projectID,
			Name:        req.Name,
			Description: req.Description,
			Status:      "Active", // Assume default status
		}, nil
	}

	return createdProject, nil
}

func (s *ProjectService) GetProjectByID(ctx context.Context, projectID string) (*models.Project, error) {
	rows, err := db.Query(ctx, db.GetProjectByIDQuery, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch project: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		var project models.Project
		if err := rows.Scan(&project.ProjectID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		return &project, nil
	}

	return nil, fmt.Errorf("project not found: %s", projectID)
}

func (s *ProjectService) ListProjects(ctx context.Context) ([]models.Project, error) {
	rows, err := db.Query(ctx, db.ListProjectsQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var project models.Project
		if err := rows.Scan(&project.ProjectID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt); err != nil {
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
