package service

import (
	"context"
	"encoding/json"
	"fmt"
	"ktrlplane/internal/config"
	"ktrlplane/internal/db"
	"ktrlplane/internal/models"
	"ktrlplane/internal/utils"

	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/subscription"
	"github.com/stripe/stripe-go/v82/subscriptionitem"
)

// ResourceService handles resource-related operations.
type ResourceService struct {
	rbacService *RBACService
	config      *config.Config
}

// NewResourceService creates a new ResourceService.
func NewResourceService(cfg *config.Config) *ResourceService {
	return &ResourceService{
		rbacService: NewRBACService(),
		config:      cfg,
	}
}

// CreateResource creates a new resource if user has write access to the project
func (s *ResourceService) CreateResource(ctx context.Context, projectID string, req models.CreateResourceRequest, userID string) (*models.Resource, error) {
	// Validate the provided ID
	if err := utils.ValidateDNSID(req.ID); err != nil {
		return nil, fmt.Errorf("invalid resource ID: %w", err)
	}

	// Check write permission on project (resources inherit from project permissions)
	hasPermission, err := s.rbacService.CheckPermission(ctx, userID, "write", "project", projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check permissions: %w", err)
	}
	if !hasPermission {
		return nil, fmt.Errorf("insufficient permissions to create resource")
	}
	
	// Determine if resource is paid (not free)
	isPaidResource := true
	sku := "free"
	// Try to extract SKU from settings_json if present, otherwise default to free
	if len(req.SettingsJSON) > 0 {
		var settings map[string]interface{}
		if err := json.Unmarshal(req.SettingsJSON, &settings); err == nil {
			if val, ok := settings["sku"].(string); ok {
				sku = val
			}
		}
	}
	if sku == "free" {
		isPaidResource = false
	}

	if isPaidResource {
		// Check billing account and subscription for project
		billingSvc := NewBillingService(s.config)
		billingAccount, err := billingSvc.GetBillingAccount("project", projectID)
		if err != nil || billingAccount == nil || billingAccount.StripeCustomerID == nil || billingAccount.StripeSubscriptionID == nil {
			return nil, fmt.Errorf("billing account with active subscription required for paid resources")
		}

		// Validate Stripe price ID for resource type and SKU
		resourceType := req.Type
		priceID, err := billingSvc.getPriceIDForResourceType(resourceType, sku)
		if err != nil || priceID == "" {
			return nil, fmt.Errorf("no Stripe price ID configured for resource type '%s' and SKU '%s': %v", resourceType, sku, err)
		}

		// Update Stripe subscription: increment quantity if item exists, else add new item
		subID := *billingAccount.StripeSubscriptionID
		sub, err := subscription.Get(subID, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch Stripe subscription: %w", err)
		}

		var itemID string
		for _, item := range sub.Items.Data {
			if item.Price != nil && item.Price.ID == priceID {
				itemID = item.ID
				break
			}
		}

		if itemID != "" {
			// Item exists, increment quantity
			newQty := int64(1)
			for _, item := range sub.Items.Data {
				if item.ID == itemID {
					newQty = item.Quantity + 1
					break
				}
			}
			params := &stripe.SubscriptionItemParams{
				Quantity: stripe.Int64(newQty),
			}
			_, err := subscriptionitem.Update(itemID, params)
			if err != nil {
				return nil, fmt.Errorf("failed to update Stripe subscription item quantity: %w", err)
			}
		} else {
			// Item does not exist, add new item
			params := &stripe.SubscriptionItemParams{
				Subscription: stripe.String(subID),
				Price:        stripe.String(priceID),
				Quantity:     stripe.Int64(1),
			}
			_, err := subscriptionitem.New(params)
			if err != nil {
				return nil, fmt.Errorf("failed to add new Stripe subscription item: %w", err)
			}
		}
	}

	err = db.ExecQuery(ctx, db.CreateResourceQuery, req.ID, projectID, req.Name, req.Type, req.SettingsJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	return s.GetResourceByID(ctx, projectID, req.ID, userID)
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

	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.GetResourceByIDQuery, projectID, resourceID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch resource: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		var resource models.Resource
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
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

	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.ListResourcesQuery, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to list resources: %w", err)
	}
	defer rows.Close()

	resources := make([]models.Resource, 0)
	for rows.Next() {
		var resource models.Resource
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
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


