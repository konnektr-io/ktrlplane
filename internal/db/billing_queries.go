package db

// Billing-related SQL queries

const GetBillingAccountQuery = `
SELECT billing_account_id, scope_type, scope_id, stripe_customer_id, 
       stripe_subscription_id, subscription_status, subscription_plan, 
       billing_email, created_at, updated_at
FROM ktrlplane.billing_accounts 
WHERE scope_type = $1 AND scope_id = $2
`

const CreateBillingAccountQuery = `
INSERT INTO ktrlplane.billing_accounts 
(billing_account_id, scope_type, scope_id, subscription_status, subscription_plan, created_at, updated_at)
VALUES ($1, $2, $3, 'trial', 'starter', NOW(), NOW())
RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
          stripe_subscription_id, subscription_status, subscription_plan, 
          billing_email, created_at, updated_at
`

const UpdateBillingAccountQuery = `
UPDATE ktrlplane.billing_accounts 
SET billing_email = COALESCE($3, billing_email),
    subscription_plan = COALESCE($4, subscription_plan),
    updated_at = NOW()
WHERE scope_type = $1 AND scope_id = $2
RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
          stripe_subscription_id, subscription_status, subscription_plan, 
          billing_email, created_at, updated_at
`

const UpdateBillingAccountStripeQuery = `
UPDATE ktrlplane.billing_accounts 
SET stripe_customer_id = $3, stripe_subscription_id = $4, subscription_status = $5, billing_email = $6, updated_at = NOW()
WHERE scope_type = $1 AND scope_id = $2
RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
          stripe_subscription_id, subscription_status, subscription_plan, 
          billing_email, created_at, updated_at
`

const UpdateBillingAccountSubscriptionQuery = `
UPDATE ktrlplane.billing_accounts 
SET stripe_subscription_id = $3, subscription_status = $4, updated_at = NOW()
WHERE scope_type = $1 AND scope_id = $2
RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
          stripe_subscription_id, subscription_status, subscription_plan, 
          billing_email, created_at, updated_at
`

const UpdateBillingAccountStatusQuery = `
UPDATE ktrlplane.billing_accounts 
SET subscription_status = $3, updated_at = NOW()
WHERE scope_type = $1 AND scope_id = $2
RETURNING billing_account_id, scope_type, scope_id, stripe_customer_id, 
          stripe_subscription_id, subscription_status, subscription_plan, 
          billing_email, created_at, updated_at
`

const GetResourceCountsOrgQuery = `
SELECT r.type, COALESCE(r.sku, 'free') as sku, COUNT(*) as count
FROM ktrlplane.resources r
JOIN ktrlplane.projects p ON r.project_id = p.project_id
WHERE p.org_id = $1
GROUP BY r.type, COALESCE(r.sku, 'free')
`

const GetResourceCountsProjectQuery = `
SELECT r.type, COALESCE(r.sku, 'free') as sku, COUNT(*) as count
FROM ktrlplane.resources r
WHERE r.project_id = $1
GROUP BY r.type, COALESCE(r.sku, 'free')
`
