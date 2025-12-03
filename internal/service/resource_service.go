package service

import (
	"context"
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
	sku := req.SKU
	isPaidResource := sku != "free"
	var stripePriceID *string

	if isPaidResource {
		// Check billing account and subscription for project
		billingSvc := NewBillingService(s.config)
		billingAccount, err := billingSvc.GetBillingAccount("project", projectID)
		if err != nil || billingAccount == nil || billingAccount.StripeCustomerID == nil || billingAccount.StripeSubscriptionID == nil {
			return nil, fmt.Errorf("billing account with active subscription required for paid resources")
		}

		// Get Stripe price ID for resource type and SKU
		priceID, err := billingSvc.GetPriceIDForResourceType(req.Type, sku)
		if err != nil || priceID == "" {
			return nil, fmt.Errorf("no Stripe price ID configured for resource type '%s' and SKU '%s': %v", req.Type, sku, err)
		}
		stripePriceID = &priceID

		// Update Stripe subscription: increment quantity if item exists, else add new item
		subID := *billingAccount.StripeSubscriptionID
		sub, err := subscription.Get(subID, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch Stripe subscription: %w", err)
		}

		// Find subscription item with this price ID
		var itemID string
		var currentQty int64
		for _, item := range sub.Items.Data {
			if item.Price != nil && item.Price.ID == priceID {
				itemID = item.ID
				currentQty = item.Quantity
				break
			}
		}

		if itemID != "" {
			// Item exists, increment quantity
			params := &stripe.SubscriptionItemParams{
				Quantity: stripe.Int64(currentQty + 1),
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

	// Create resource in database with SKU and Stripe price ID
	err = db.ExecQuery(ctx, db.CreateResourceQuery, req.ID, projectID, req.Name, req.Type, sku, stripePriceID, req.SettingsJSON)
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
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.SKU, &resource.StripePriceID, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
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
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.SKU, &resource.StripePriceID, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
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

	// Get current resource to check for SKU changes
	currentResource, err := s.GetResourceByID(ctx, projectID, resourceID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch current resource: %w", err)
	}

	// Handle SKU change if requested
	var newStripePriceID *string
	if req.SKU != nil && *req.SKU != currentResource.SKU {
		// Tier change requested
		billingSvc := NewBillingService(s.config)
		billingAccount, err := billingSvc.GetBillingAccount("project", projectID)
		if err != nil || billingAccount == nil || billingAccount.StripeCustomerID == nil || billingAccount.StripeSubscriptionID == nil {
			return nil, fmt.Errorf("billing account with active subscription required for tier changes")
		}

		// Get new price ID
		newPriceID, err := billingSvc.GetPriceIDForResourceType(currentResource.Type, *req.SKU)
		if err != nil || newPriceID == "" {
			return nil, fmt.Errorf("no Stripe price ID configured for resource type '%s' and SKU '%s': %v", currentResource.Type, *req.SKU, err)
		}
		newStripePriceID = &newPriceID

		// Manage Stripe subscription items
		subID := *billingAccount.StripeSubscriptionID
		sub, err := subscription.Get(subID, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch Stripe subscription: %w", err)
		}

		// Decrement old price ID (if not free tier)
		if currentResource.SKU != "free" && currentResource.StripePriceID != nil {
			oldPriceID := *currentResource.StripePriceID
			for _, item := range sub.Items.Data {
				if item.Price != nil && item.Price.ID == oldPriceID {
					if item.Quantity > 1 {
						// Decrement quantity
						params := &stripe.SubscriptionItemParams{
							Quantity: stripe.Int64(item.Quantity - 1),
						}
						_, err := subscriptionitem.Update(item.ID, params)
						if err != nil {
							return nil, fmt.Errorf("failed to decrement old tier subscription item: %w", err)
						}
					} else {
						// Remove item entirely if quantity would be 0
						_, err := subscriptionitem.Del(item.ID, nil)
						if err != nil {
							return nil, fmt.Errorf("failed to remove old tier subscription item: %w", err)
						}
					}
					break
				}
			}
		}

		// Increment new price ID (if not free tier)
		if *req.SKU != "free" {
			// Find or create subscription item for new price
			var newItemID string
			var currentQty int64
			for _, item := range sub.Items.Data {
				if item.Price != nil && item.Price.ID == newPriceID {
					newItemID = item.ID
					currentQty = item.Quantity
					break
				}
			}

			if newItemID != "" {
				// Item exists, increment quantity
				params := &stripe.SubscriptionItemParams{
					Quantity: stripe.Int64(currentQty + 1),
				}
				_, err := subscriptionitem.Update(newItemID, params)
				if err != nil {
					return nil, fmt.Errorf("failed to increment new tier subscription item: %w", err)
				}
			} else {
				// Item does not exist, create it
				params := &stripe.SubscriptionItemParams{
					Subscription: stripe.String(subID),
					Price:        stripe.String(newPriceID),
					Quantity:     stripe.Int64(1),
				}
				_, err := subscriptionitem.New(params)
				if err != nil {
					return nil, fmt.Errorf("failed to add new tier subscription item: %w", err)
				}
			}
		}
	}

	// Determine final SKU and price ID for database update
	finalSKU := currentResource.SKU
	finalPriceID := currentResource.StripePriceID
	if req.SKU != nil {
		finalSKU = *req.SKU
		finalPriceID = newStripePriceID
	}

	// Determine final name and settings
	finalName := currentResource.Name
	if req.Name != nil {
		finalName = *req.Name
	}
	finalSettings := currentResource.SettingsJSON
	if req.SettingsJSON != nil {
		finalSettings = req.SettingsJSON
	}

	// Update resource in database
	err = db.ExecQuery(ctx, db.UpdateResourceQuery, projectID, resourceID, finalName, finalSKU, finalPriceID, finalSettings)
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

	// Get resource to retrieve price ID before deletion
	resource, err := s.GetResourceByID(ctx, projectID, resourceID, userID)
	if err != nil {
		return fmt.Errorf("failed to fetch resource: %w", err)
	}

	// Decrement Stripe subscription item if not free tier
	if resource.SKU != "free" && resource.StripePriceID != nil {
		billingSvc := NewBillingService(s.config)
		billingAccount, err := billingSvc.GetBillingAccount("project", projectID)
		if err == nil && billingAccount != nil && billingAccount.StripeSubscriptionID != nil {
			subID := *billingAccount.StripeSubscriptionID
			sub, err := subscription.Get(subID, nil)
			if err == nil {
				priceID := *resource.StripePriceID
				for _, item := range sub.Items.Data {
					if item.Price != nil && item.Price.ID == priceID {
						if item.Quantity > 1 {
							// Decrement quantity
							params := &stripe.SubscriptionItemParams{
								Quantity: stripe.Int64(item.Quantity - 1),
							}
							_, err := subscriptionitem.Update(item.ID, params)
							if err != nil {
								return fmt.Errorf("failed to decrement subscription item quantity: %w", err)
							}
						} else {
							// Remove item entirely if quantity would be 0
							_, err := subscriptionitem.Del(item.ID, nil)
							if err != nil {
								return fmt.Errorf("failed to remove subscription item: %w", err)
							}
						}
						break
					}
				}
			}
			// Note: We continue with deletion even if Stripe update fails
			// to avoid orphaned database records
		}
	}

	return db.ExecQuery(ctx, db.DeleteResourceQuery, projectID, resourceID)
}

// ListAllUserResources returns all resources the user has access to across all projects
// with optional filtering by resource type. Respects RBAC inheritance (organization -> project -> resource).
func (s *ResourceService) ListAllUserResources(ctx context.Context, userID string, resourceType string) ([]models.Resource, error) {
	pool := db.GetDB()
	rows, err := pool.Query(ctx, db.ListAllUserResourcesQuery, userID, resourceType)
	if err != nil {
		return nil, fmt.Errorf("failed to list user resources: %w", err)
	}
	defer rows.Close()

	resources := make([]models.Resource, 0)
	for rows.Next() {
		var resource models.Resource
		if err := rows.Scan(&resource.ResourceID, &resource.ProjectID, &resource.Name, &resource.Type, &resource.SKU, &resource.StripePriceID, &resource.Status, &resource.SettingsJSON, &resource.ErrorMessage, &resource.CreatedAt, &resource.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan resource: %w", err)
		}
		resources = append(resources, resource)
	}

	return resources, nil
}


