-- Migration to remove description field from projects table
-- This field is no longer used and has been removed from the application

ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS subscription_plan;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS billing_email;
ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS inherits_billing_from_org;
