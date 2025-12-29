-- Migration to remove subscription_status, subscription_plan, billing_email, inherits_billing_from_org fields from projects table
-- These fields are no longer used and have been removed from the application

ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS subscription_plan;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS billing_email;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS inherits_billing_from_org;
