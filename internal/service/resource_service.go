package service

import (
	"context"
	"fmt"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"

	"github.com/google/uuid"
)

type ResourceService struct{}

func NewResourceService() *ResourceService {
	return &ResourceService{}
}

func (s *ResourceService) CreateResource(ctx context.Context, projectID string, req models.CreateResourceRequest) (*models.Resource, error) {
	resourceID := uuid.New().String()

	err := db.ExecQuery(ctx, db.CreateResourceQuery, resourceID, projectID, req.Name, req.Type, req.HelmValues)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	return s.GetResourceByID(ctx, projectID, resourceID)
}

func (s *ResourceService) GetResourceByID(ctx context.Context, projectID string, resourceID string) (*models.Resource, error) {
	rows, err := db.Query(ctx, db.GetResourceByIDQuery, projectID, resourceID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch resource: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		var resource models.Resource
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.Status, &resource.HelmValues, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan resource: %w", err)
		}
		return &resource, nil
	}

	return nil, fmt.Errorf("resource not found: %s", resourceID)
}

func (s *ResourceService) ListResources(ctx context.Context, projectID string) ([]models.Resource, error) {
	rows, err := db.Query(ctx, db.ListResourcesQuery, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to list resources: %w", err)
	}
	defer rows.Close()

	var resources []models.Resource
	for rows.Next() {
		var resource models.Resource
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.Status, &resource.HelmValues, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan resource: %w", err)
		}
		resources = append(resources, resource)
	}

	return resources, nil
}

func (s *ResourceService) UpdateResource(ctx context.Context, projectID string, resourceID string, req models.UpdateResourceRequest) (*models.Resource, error) {
	err := db.ExecQuery(ctx, db.UpdateResourceQuery, projectID, resourceID, req.Name, req.HelmValues)
	if err != nil {
		return nil, fmt.Errorf("failed to update resource: %w", err)
	}

	return s.GetResourceByID(ctx, projectID, resourceID)
}

func (s *ResourceService) DeleteResource(ctx context.Context, projectID string, resourceID string) error {
	return db.ExecQuery(ctx, db.DeleteResourceQuery, projectID, resourceID)
}
