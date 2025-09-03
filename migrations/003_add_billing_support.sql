-- Migration: Add billing support with Stripe integration
-- This migration adds billing-related tables and permissions

SET search_path TO ktrlplane, public;

-- Add billing permission to permissions table
INSERT INTO ktrlplane.permissions (permission_id, resource_type, action, description, created_at) VALUES
('00000000-0001-0000-0000-000000000005', 'Konnektr.KtrlPlane', 'manage_billing', 'Manage billing and subscription settings', NOW());

-- Add billing permission to Owner role
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0001-0000-0000-000000000001', '00000000-0001-0000-0000-000000000005'); -- Owner gets manage_billing

-- Add billing fields to organizations table
ALTER TABLE ktrlplane.organizations ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE ktrlplane.organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE ktrlplane.organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';
ALTER TABLE ktrlplane.organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter';
ALTER TABLE ktrlplane.organizations ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);

-- Add billing fields to projects table
ALTER TABLE ktrlplane.projects ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE ktrlplane.projects ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE ktrlplane.projects ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';
ALTER TABLE ktrlplane.projects ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter';
ALTER TABLE ktrlplane.projects ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
ALTER TABLE ktrlplane.projects ADD COLUMN IF NOT EXISTS inherits_billing_from_org BOOLEAN DEFAULT true;

-- Create billing_accounts table for shared billing management
CREATE TABLE IF NOT EXISTS ktrlplane.billing_accounts (
    billing_account_id VARCHAR(255) PRIMARY KEY,
    scope_type VARCHAR(50) NOT NULL, -- 'organization' or 'project'
    scope_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    billing_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(scope_type, scope_id)
);

-- Create indexes for billing tables
CREATE INDEX IF NOT EXISTS idx_billing_accounts_scope ON ktrlplane.billing_accounts(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer ON ktrlplane.billing_accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON ktrlplane.organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_stripe_customer ON ktrlplane.projects(stripe_customer_id);

-- Insert billing accounts for existing organizations and projects
INSERT INTO ktrlplane.billing_accounts (billing_account_id, scope_type, scope_id, billing_email)
SELECT 
    CONCAT('bill_', org_id), 
    'organization', 
    org_id,
    NULL
FROM ktrlplane.organizations
ON CONFLICT (scope_type, scope_id) DO NOTHING;

INSERT INTO ktrlplane.billing_accounts (billing_account_id, scope_type, scope_id, billing_email)
SELECT 
    CONCAT('bill_', project_id), 
    'project', 
    project_id,
    NULL
FROM ktrlplane.projects
WHERE inherits_billing_from_org = false
ON CONFLICT (scope_type, scope_id) DO NOTHING;
