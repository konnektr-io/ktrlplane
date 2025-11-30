-- Migration: Remove subscription_status, subscription_plan, billing_email from billing_accounts
ALTER TABLE ktrlplane.billing_accounts DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE ktrlplane.billing_accounts DROP COLUMN IF EXISTS subscription_plan;
ALTER TABLE ktrlplane.billing_accounts DROP COLUMN IF EXISTS billing_email;

-- Migration: Remove Stripe IDs from projects and organizations tables
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE ktrlplane.organizations DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE ktrlplane.organizations DROP COLUMN IF EXISTS stripe_subscription_id;
