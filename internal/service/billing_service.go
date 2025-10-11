package service

import (
	"context"
	"errors"
	"fmt"
	"ktrlplane/internal/config"
	"ktrlplane/internal/models"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/billingportal/session"
	"github.com/stripe/stripe-go/v82/customer"
	"github.com/stripe/stripe-go/v82/paymentmethod"
	"github.com/stripe/stripe-go/v82/price"
	"github.com/stripe/stripe-go/v82/subscription"
)

// BillingService handles billing operations and Stripe integration.
type BillingService struct {
	db     *pgxpool.Pool
	config *config.Config
}

// NewBillingService creates a new BillingService.
func NewBillingService(db *pgxpool.Pool, cfg *config.Config) *BillingService {
	return &BillingService{
		db:     db,
		config: cfg,
	}
}

// GetBillingAccount retrieves billing information for a scope (organization or project)
func (s *BillingService) GetBillingAccount(scopeType, scopeID string) (*models.BillingAccount, error) {
	query := `
		SELECT billing_account_id, scope_type, scope_id, stripe_customer_id, 
		       stripe_subscription_id, subscription_status, subscription_plan, 
		       billing_email, created_at, updated_at
		FROM ktrlplane.billing_accounts 
		WHERE scope_type = $1 AND scope_id = $2
	`

	var account models.BillingAccount
	row := s.db.QueryRow(context.Background(), query, scopeType, scopeID)

	err := row.Scan(
		&account.BillingAccountID,
		&account.ScopeType,
		&account.ScopeID,
		&account.StripeCustomerID,
		&account.StripeSubscriptionID,
		&account.SubscriptionStatus,
		&account.SubscriptionPlan,
		&account.BillingEmail,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "no rows in result set" {
			// Create billing account if it doesn't exist
			return s.createBillingAccount(scopeType, scopeID)
		}
		return nil, fmt.Errorf("failed to get billing account: %w", err)
	}

	return &account, nil
}

// createBillingAccount creates a new billing account for a scope
func (s *BillingService) createBillingAccount(scopeType, scopeID string) (*models.BillingAccount, error) {
	billingAccountID := fmt.Sprintf("bill_%s", scopeID)

	query := `
		INSERT INTO ktrlplane.billing_accounts 
		(billing_account_id, scope_type, scope_id, subscription_status, subscription_plan, created_at, updated_at)
		VALUES ($1, $2, $3, 'trial', 'starter', NOW(), NOW())
		RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
		          stripe_subscription_id, subscription_status, subscription_plan, 
		          billing_email, created_at, updated_at
	`

	var account models.BillingAccount
	row := s.db.QueryRow(context.Background(), query, billingAccountID, scopeType, scopeID)

	err := row.Scan(
		&account.BillingAccountID,
		&account.ScopeType,
		&account.ScopeID,
		&account.StripeCustomerID,
		&account.StripeSubscriptionID,
		&account.SubscriptionStatus,
		&account.SubscriptionPlan,
		&account.BillingEmail,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create billing account: %w", err)
	}

	return &account, nil
}

// UpdateBillingAccount updates billing account information
func (s *BillingService) UpdateBillingAccount(scopeType, scopeID string, req models.UpdateBillingRequest) (*models.BillingAccount, error) {
	query := `
		UPDATE ktrlplane.billing_accounts 
		SET billing_email = COALESCE($3, billing_email),
		    subscription_plan = COALESCE($4, subscription_plan),
		    updated_at = NOW()
		WHERE scope_type = $1 AND scope_id = $2
		RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
		          stripe_subscription_id, subscription_status, subscription_plan, 
		          billing_email, created_at, updated_at
	`

	var account models.BillingAccount
	row := s.db.QueryRow(context.Background(), query, scopeType, scopeID, req.BillingEmail, req.SubscriptionPlan)

	err := row.Scan(
		&account.BillingAccountID,
		&account.ScopeType,
		&account.ScopeID,
		&account.StripeCustomerID,
		&account.StripeSubscriptionID,
		&account.SubscriptionStatus,
		&account.SubscriptionPlan,
		&account.BillingEmail,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update billing account: %w", err)
	}

	return &account, nil
}

// CreateStripeCustomer creates a Stripe customer and updates the billing account
func (s *BillingService) CreateStripeCustomer(scopeType, scopeID string, req models.CreateStripeCustomerRequest) (*models.BillingAccount, error) {
	// Create Stripe customer
	params := &stripe.CustomerParams{
		Email: stripe.String(req.Email),
		Name:  stripe.String(req.Name),
	}

	if req.Description != "" {
		params.Description = stripe.String(req.Description)
	}

	stripeCustomer, err := customer.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create Stripe customer: %w", err)
	}

	// Get existing resources to create subscription items
	resourceCounts, err := s.getResourceCounts(scopeType, scopeID)
	if err != nil {
		fmt.Printf("Warning: Failed to get resource counts: %v\n", err)
		resourceCounts = make(map[string]int)
	}

	// Create subscription with resource-based items if we have resources
	var subscriptionID *string
	var subscriptionStatus string = "trial"

	if len(resourceCounts) > 0 {
		subscription, err := s.createSubscriptionWithResources(stripeCustomer.ID, resourceCounts)
		if err != nil {
			fmt.Printf("Warning: Failed to create subscription: %v\n", err)
		} else if subscription != nil {
			subscriptionID = &subscription.ID
			subscriptionStatus = string(subscription.Status)
		}
	}

	// Update billing account with Stripe customer ID and subscription ID (if created)
	query := `
		UPDATE ktrlplane.billing_accounts 
		SET stripe_customer_id = $3, stripe_subscription_id = $4, subscription_status = $5, billing_email = $6, updated_at = NOW()
		WHERE scope_type = $1 AND scope_id = $2
		RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
		          stripe_subscription_id, subscription_status, subscription_plan, 
		          billing_email, created_at, updated_at
	`

	var account models.BillingAccount
	row := s.db.QueryRow(context.Background(), query, scopeType, scopeID, stripeCustomer.ID, subscriptionID, subscriptionStatus, req.Email)

	err = row.Scan(
		&account.BillingAccountID,
		&account.ScopeType,
		&account.ScopeID,
		&account.StripeCustomerID,
		&account.StripeSubscriptionID,
		&account.SubscriptionStatus,
		&account.SubscriptionPlan,
		&account.BillingEmail,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update billing account with Stripe customer: %w", err)
	}

	return &account, nil
}

// CreateStripeSubscription creates a Stripe subscription
func (s *BillingService) CreateStripeSubscription(scopeType, scopeID string, req models.CreateStripeSubscriptionRequest) (*models.BillingAccount, error) {
	// Get billing account
	account, err := s.GetBillingAccount(scopeType, scopeID)
	if err != nil {
		return nil, err
	}

	if account.StripeCustomerID == nil {
		return nil, errors.New("Stripe customer not found")
	}

	// Get resource counts for subscription items
	resourceCounts, err := s.getResourceCounts(scopeType, scopeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get resource counts: %w", err)
	}

	// Build subscription items based on resources
	var items []*stripe.SubscriptionItemsParams
	for resourceKey, count := range resourceCounts {
		if count > 0 {
			// Parse resourceKey which is now "resourceType:sku"
			resourceType, sku := parseResourceKey(resourceKey)
			priceID, err := s.getPriceIDForResourceType(resourceType, sku)
			if err != nil {
				return nil, fmt.Errorf("failed to get price ID for resource type %s with SKU %s: %w", resourceType, sku, err)
			}
			items = append(items, &stripe.SubscriptionItemsParams{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(int64(count)),
			})
		}
	}

	if len(items) == 0 {
		return nil, errors.New("no resources found to create subscription items")
	}

	// Create Stripe subscription
	params := &stripe.SubscriptionParams{
		Customer: stripe.String(*account.StripeCustomerID),
		Items:    items,
	}

	stripeSubscription, err := subscription.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create Stripe subscription: %w", err)
	}

	// Update billing account with subscription ID and status
	query := `
		UPDATE ktrlplane.billing_accounts 
		SET stripe_subscription_id = $3, subscription_status = $4, updated_at = NOW()
		WHERE scope_type = $1 AND scope_id = $2
		RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
		          stripe_subscription_id, subscription_status, subscription_plan, 
		          billing_email, created_at, updated_at
	`

	row := s.db.QueryRow(context.Background(), query, scopeType, scopeID, stripeSubscription.ID, string(stripeSubscription.Status))

	err = row.Scan(
		&account.BillingAccountID,
		&account.ScopeType,
		&account.ScopeID,
		&account.StripeCustomerID,
		&account.StripeSubscriptionID,
		&account.SubscriptionStatus,
		&account.SubscriptionPlan,
		&account.BillingEmail,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update billing account with subscription: %w", err)
	}

	return account, nil
}

// CreateStripeCustomerPortal creates a Stripe customer portal session
func (s *BillingService) CreateStripeCustomerPortal(scopeType, scopeID, returnURL string) (string, error) {
	// Get billing account
	account, err := s.GetBillingAccount(scopeType, scopeID)
	if err != nil {
		return "", err
	}

	if account.StripeCustomerID == nil {
		return "", errors.New("Stripe customer not found")
	}

	// Create customer portal session
	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(*account.StripeCustomerID),
		ReturnURL: stripe.String(returnURL),
	}

	portalSession, err := session.New(params)
	if err != nil {
		return "", fmt.Errorf("failed to create customer portal session: %w", err)
	}

	return portalSession.URL, nil
}

// CancelSubscription cancels a Stripe subscription
func (s *BillingService) CancelSubscription(scopeType, scopeID string) (*models.BillingAccount, error) {
	// Get billing account
	account, err := s.GetBillingAccount(scopeType, scopeID)
	if err != nil {
		return nil, err
	}

	if account.StripeSubscriptionID == nil {
		return nil, errors.New("no active subscription found")
	}

	// Cancel Stripe subscription
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(true),
	}

	stripeSubscription, err := subscription.Update(*account.StripeSubscriptionID, params)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel Stripe subscription: %w", err)
	}

	// Update billing account status
	query := `
		UPDATE ktrlplane.billing_accounts 
		SET subscription_status = $3, updated_at = NOW()
		WHERE scope_type = $1 AND scope_id = $2
		RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
		          stripe_subscription_id, subscription_status, subscription_plan, 
		          billing_email, created_at, updated_at
	`

	row := s.db.QueryRow(context.Background(), query, scopeType, scopeID, string(stripeSubscription.Status))

	err = row.Scan(
		&account.BillingAccountID,
		&account.ScopeType,
		&account.ScopeID,
		&account.StripeCustomerID,
		&account.StripeSubscriptionID,
		&account.SubscriptionStatus,
		&account.SubscriptionPlan,
		&account.BillingEmail,
		&account.CreatedAt,
		&account.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update billing account status: %w", err)
	}

	return account, nil
}

// GetBillingInfo retrieves comprehensive billing information including Stripe data
func (s *BillingService) GetBillingInfo(scopeType, scopeID string) (*models.BillingInfo, error) {
	// Get billing account
	account, err := s.GetBillingAccount(scopeType, scopeID)
	if err != nil {
		return nil, err
	}

	billingInfo := &models.BillingInfo{
		BillingAccount: *account,
	}

	// If Stripe customer exists, get additional Stripe data
	if account.StripeCustomerID != nil {
		// Get upcoming invoice
		/* if account.StripeSubscriptionID != nil {
			upcomingInvoice, err := invoice.Upcoming(&stripe.InvoiceUpcomingParams{
				Customer:     stripe.String(*account.StripeCustomerID),
				Subscription: stripe.String(*account.StripeSubscriptionID),
			})
			if err == nil {
				billingInfo.UpcomingInvoice = &models.StripeInvoice{
					ID:               upcomingInvoice.ID,
					AmountDue:        upcomingInvoice.AmountDue,
					Currency:         string(upcomingInvoice.Currency),
					PeriodStart:      upcomingInvoice.PeriodStart,
					PeriodEnd:        upcomingInvoice.PeriodEnd,
					Status:           string(upcomingInvoice.Status),
					HostedInvoiceURL: &upcomingInvoice.HostedInvoiceURL,
				}
			}
		} */

		// Get payment methods
		pmParams := &stripe.PaymentMethodListParams{
			Customer: stripe.String(*account.StripeCustomerID),
			Type:     stripe.String("card"),
		}

		pmIterator := paymentmethod.List(pmParams)
		var paymentMethods []models.StripePaymentMethod

		for pmIterator.Next() {
			pm := pmIterator.PaymentMethod()
			stripePaymentMethod := models.StripePaymentMethod{
				ID:   pm.ID,
				Type: string(pm.Type),
			}

			if pm.Card != nil {
				stripePaymentMethod.Card = &struct {
					Brand    string `json:"brand"`
					Last4    string `json:"last4"`
					ExpMonth int64  `json:"exp_month"`
					ExpYear  int64  `json:"exp_year"`
				}{
					Brand:    string(pm.Card.Brand),
					Last4:    pm.Card.Last4,
					ExpMonth: int64(pm.Card.ExpMonth),
					ExpYear:  int64(pm.Card.ExpYear),
				}
			}

			paymentMethods = append(paymentMethods, stripePaymentMethod)
		}

		billingInfo.PaymentMethods = paymentMethods
	}

	// Get subscription details and items if subscription exists
	if account.StripeSubscriptionID != nil && *account.StripeSubscriptionID != "" {
		sub, err := subscription.Get(*account.StripeSubscriptionID, &stripe.SubscriptionParams{
			Expand: []*string{stripe.String("items.data.price.product")},
		})
		if err != nil {
			fmt.Printf("Warning: Failed to get subscription details: %v\n", err)
		} else {
			// Add subscription items to billing info
			var subscriptionItems []models.StripeSubscriptionItem
			for _, item := range sub.Items.Data {
				subscriptionItem := models.StripeSubscriptionItem{
					ID:       item.ID,
					Quantity: item.Quantity,
				}

				if item.Price != nil {
					subscriptionItem.Price = &struct {
						ID         string `json:"id"`
						UnitAmount int64  `json:"unit_amount"`
						Currency   string `json:"currency"`
						Recurring  *struct {
							Interval      string `json:"interval"`
							IntervalCount int64  `json:"interval_count"`
						} `json:"recurring,omitempty"`
						Product *struct {
							ID          string `json:"id"`
							Name        string `json:"name"`
							Description string `json:"description"`
						} `json:"product,omitempty"`
					}{
						ID:         item.Price.ID,
						UnitAmount: item.Price.UnitAmount,
						Currency:   string(item.Price.Currency),
					}

					if item.Price.Recurring != nil {
						subscriptionItem.Price.Recurring = &struct {
							Interval      string `json:"interval"`
							IntervalCount int64  `json:"interval_count"`
						}{
							Interval:      string(item.Price.Recurring.Interval),
							IntervalCount: item.Price.Recurring.IntervalCount,
						}
					}

					if item.Price.Product != nil {
						subscriptionItem.Price.Product = &struct {
							ID          string `json:"id"`
							Name        string `json:"name"`
							Description string `json:"description"`
						}{
							ID:          item.Price.Product.ID,
							Name:        item.Price.Product.Name,
							Description: item.Price.Product.Description,
						}
					}
				}

				subscriptionItems = append(subscriptionItems, subscriptionItem)
			}

			billingInfo.SubscriptionItems = subscriptionItems

			// Add subscription status details
			billingInfo.SubscriptionDetails = &models.StripeSubscriptionDetails{
				ID:                 sub.ID,
				Status:             string(sub.Status),
				CurrentPeriodStart: 0, // Not available in this SDK version
				CurrentPeriodEnd:   0, // Not available in this SDK version
				CancelAtPeriodEnd:  sub.CancelAtPeriodEnd,
			}
		}
	}

	return billingInfo, nil
}

// getProductIDForResourceType maps resource types and SKUs to Stripe product IDs
func (s *BillingService) getProductIDForResourceType(resourceType, sku string) string {
	for _, product := range s.config.Stripe.Products {
		if product.ResourceType == resourceType && product.SKU == sku {
			return product.ProductID
		}
	}
	return ""
}

// getPriceIDForResourceType gets the default price ID for a resource type and SKU
func (s *BillingService) getPriceIDForResourceType(resourceType, sku string) (string, error) {
	productID := s.getProductIDForResourceType(resourceType, sku)
	if productID == "" {
		return "", fmt.Errorf("no product ID configured for resource type %s with SKU %s", resourceType, sku)
	}

	priceID, err := s.getDefaultPriceForProduct(productID)
	if err != nil {
		return "", fmt.Errorf("failed to get price for product %s: %w", productID, err)
	}

	return priceID, nil
}

// parseResourceKey splits a resourceKey like "Konnektr.DigitalTwins:free" into resourceType and sku
func parseResourceKey(resourceKey string) (resourceType, sku string) {
	parts := strings.Split(resourceKey, ":")
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	// Fallback for resources without SKU (default to free)
	return resourceKey, "free"
}

// getDefaultPriceForProduct fetches the default price for a Stripe product
func (s *BillingService) getDefaultPriceForProduct(productID string) (string, error) {
	// List prices for this product
	params := &stripe.PriceListParams{
		Product: stripe.String(productID),
		Active:  stripe.Bool(true),
	}

	iter := price.List(params)
	if iter.Next() {
		// Return the first active price (typically the default)
		return iter.Price().ID, nil
	}

	if iter.Err() != nil {
		return "", fmt.Errorf("error listing prices for product %s: %w", productID, iter.Err())
	}

	return "", fmt.Errorf("no active prices found for product %s", productID)
}

// getResourceCounts counts resources by type and SKU for a given scope (organization or project)
func (s *BillingService) getResourceCounts(scopeType, scopeID string) (map[string]int, error) {
	resourceCounts := make(map[string]int)

	var query string
	if scopeType == "organization" {
		// For organizations, count resources across all projects in the organization
		query = `
			SELECT r.type, COALESCE(r.sku, 'free') as sku, COUNT(*) as count
			FROM ktrlplane.resources r
			JOIN ktrlplane.projects p ON r.project_id = p.project_id
			WHERE p.org_id = $1
			GROUP BY r.type, COALESCE(r.sku, 'free')
		`
	} else {
		// For projects, count resources directly in the project
		query = `
			SELECT r.type, COALESCE(r.sku, 'free') as sku, COUNT(*) as count
			FROM ktrlplane.resources r
			WHERE r.project_id = $1
			GROUP BY r.type, COALESCE(r.sku, 'free')
		`
	}

	rows, err := s.db.Query(context.Background(), query, scopeID)
	if err != nil {
		return nil, fmt.Errorf("failed to query resource counts: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var resourceType, sku string
		var count int
		if err := rows.Scan(&resourceType, &sku, &count); err != nil {
			return nil, fmt.Errorf("failed to scan resource count: %w", err)
		}
		// Create composite key: "resourceType:sku"
		resourceKey := fmt.Sprintf("%s:%s", resourceType, sku)
		resourceCounts[resourceKey] = count
	}

	return resourceCounts, nil
}

// createSubscriptionWithResources creates a Stripe subscription with items based on resource counts
func (s *BillingService) createSubscriptionWithResources(customerID string, resourceCounts map[string]int) (*stripe.Subscription, error) {
	var subscriptionItems []*stripe.SubscriptionItemsParams

	// Create subscription items for each resource type:sku combination
	for resourceKey, count := range resourceCounts {
		if count <= 0 {
			continue
		}

		// Parse resourceKey which is now "resourceType:sku"
		resourceType, sku := parseResourceKey(resourceKey)

		// Get product ID for this resource type and SKU
		productID := s.getProductIDForResourceType(resourceType, sku)
		if productID == "" {
			fmt.Printf("Warning: No product ID configured for resource type %s with SKU %s\n", resourceType, sku)
			continue
		}

		// Get the default price for this product from Stripe
		priceID, err := s.getDefaultPriceForProduct(productID)
		if err != nil {
			fmt.Printf("Warning: Failed to get price for product %s: %v\n", productID, err)
			continue
		}

		subscriptionItems = append(subscriptionItems, &stripe.SubscriptionItemsParams{
			Price:    stripe.String(priceID),
			Quantity: stripe.Int64(int64(count)),
		})
	}

	// If no mapped resources found, create an empty subscription that items can be added to later
	if len(subscriptionItems) == 0 {
		fmt.Printf("No subscription items found, creating empty subscription for future use\n")
		subParams := &stripe.SubscriptionParams{
			Customer: stripe.String(customerID),
			Items:    []*stripe.SubscriptionItemsParams{},
		}
		return subscription.New(subParams)
	}

	// Create the subscription with items
	subParams := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items:    subscriptionItems,
		// Default payment behavior - customer will need to add payment method
		PaymentBehavior: stripe.String("default_incomplete"),
	}

	subscription, err := subscription.New(subParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	return subscription, nil
}
