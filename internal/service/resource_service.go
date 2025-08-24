package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
)

type ResourceService struct {
	rbacService *RBACService
}

func NewResourceService() *ResourceService {
	return &ResourceService{
		rbacService: NewRBACService(),
	}
}

// CreateResource creates a new resource if user has write access to the project
func (s *ResourceService) CreateResource(ctx context.Context, projectID string, req models.CreateResourceRequest, userID string) (*models.Resource, error) {
	// Check write permission on project (resources inherit from project permissions)
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to create resource")
	}

	resourceID := uuid.New().String()

	err = db.ExecQuery(ctx, db.CreateResourceQuery, resourceID, projectID, req.Name, req.Type, req.SettingsJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	return s.GetResourceByID(ctx, projectID, resourceID, userID)
}

// GetResourceByID returns a resource if user has read access to the project
func (s *ResourceService) GetResourceByID(ctx context.Context, projectID string, resourceID string, userID string) (*models.Resource, error) {
	// Check read permission on project (resources inherit from project permissions)
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "read", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		// Return "not found" instead of "forbidden" for security (don't reveal existence)
		return nil, fmt.Errorf("resource not found: %s", resourceID)
	}

	rows, err := db.Query(ctx, db.GetResourceByIDQuery, projectID, resourceID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch resource: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		var resource models.Resource
	if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.AccessURL, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan resource: %w", err)
		}
		return &resource, nil
	}

	return nil, fmt.Errorf("resource not found: %s", resourceID)
}

// ListResources returns resources in a project using permission-aware query
func (s *ResourceService) ListResources(ctx context.Context, projectID string, userID string) ([]models.Resource, error) {
	// Check read permission on project (resources inherit from project permissions)
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "read", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		// Return empty list instead of error for security
		return []models.Resource{}, nil
	}

	rows, err := db.Query(ctx, db.ListResourcesQuery, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to list resources: %w", err)
	}
	defer rows.Close()

	resources := make([]models.Resource, 0)
	for rows.Next() {
		var resource models.Resource
	if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.AccessURL, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan resource: %w", err)
		}
		resources = append(resources, resource)
	}

	return resources, nil
}

// UpdateResource updates a resource if user has write access to the project
func (s *ResourceService) UpdateResource(ctx context.Context, projectID string, resourceID string, req models.UpdateResourceRequest, userID string) (*models.Resource, error) {
	// Check write permission on project (resources inherit from project permissions)
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to update resource")
	}

	err = db.ExecQuery(ctx, db.UpdateResourceQuery, projectID, resourceID, req.Name, req.SettingsJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update resource: %w", err)
	}

	return s.GetResourceByID(ctx, projectID, resourceID, userID)
}

// DeleteResource deletes a resource if user has delete access to the project
func (s *ResourceService) DeleteResource(ctx context.Context, projectID string, resourceID string, userID string) error {
	// Check delete permission on project (resources inherit from project permissions)
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "delete", "project", projectID)
	if err != nil {
		return fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return fmt.Errorf("insufficient permissions to delete resource")
	}

	return db.ExecQuery(ctx, db.DeleteResourceQuery, projectID, resourceID)
}
