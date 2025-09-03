package service

import (
	"context"
	"errors"
	"fmt"
	"ktrlplane/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/billingportal/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/invoice"
	"github.com/stripe/stripe-go/v76/paymentmethod"
	"github.com/stripe/stripe-go/v76/subscription"
)

type BillingService struct {
	db *pgxpool.Pool
}

func NewBillingService(db *pgxpool.Pool) *BillingService {
	return &BillingService{db: db}
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
	
	// Update billing account with Stripe customer ID
	query := `
		UPDATE ktrlplane.billing_accounts 
		SET stripe_customer_id = $3, billing_email = $4, updated_at = NOW()
		WHERE scope_type = $1 AND scope_id = $2
		RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
		          stripe_subscription_id, subscription_status, subscription_plan, 
		          billing_email, created_at, updated_at
	`
	
	var account models.BillingAccount
	row := s.db.QueryRow(context.Background(), query, scopeType, scopeID, stripeCustomer.ID, req.Email)
	
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
	
	// Create Stripe subscription
	params := &stripe.SubscriptionParams{
		Customer: stripe.String(*account.StripeCustomerID),
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(req.PriceID),
			},
		},
		DefaultPaymentMethod: stripe.String(req.PaymentMethodID),
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
		if account.StripeSubscriptionID != nil {
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
		}
		
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
	
	return billingInfo, nil
}
