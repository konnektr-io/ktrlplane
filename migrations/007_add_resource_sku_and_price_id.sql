-- Migration: Add SKU and Stripe Price ID to Resources Table
-- This allows proper tracking of resource tiers and their associated Stripe prices
-- for accurate subscription management and tier changes

-- Add sku column (tier identifier like 'free', 'basic', 'pro')
ALTER TABLE ktrlplane.resources 
ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Add stripe_price_id column (Stripe price ID for paid tiers)
ALTER TABLE ktrlplane.resources 
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);

-- Create index for efficient queries by SKU
CREATE INDEX IF NOT EXISTS idx_resources_sku ON ktrlplane.resources(sku);

-- Create index for efficient queries by Stripe price ID
CREATE INDEX IF NOT EXISTS idx_resources_stripe_price_id ON ktrlplane.resources(stripe_price_id);

-- Update existing resources to have 'free' SKU by default (if not already set)
UPDATE ktrlplane.resources 
SET sku = 'free' 
WHERE sku IS NULL;

-- Make sku NOT NULL after setting defaults
ALTER TABLE ktrlplane.resources 
ALTER COLUMN sku SET NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN ktrlplane.resources.sku IS 'Resource tier/SKU identifier (e.g., free, basic, pro, enterprise)';
COMMENT ON COLUMN ktrlplane.resources.stripe_price_id IS 'Stripe price ID associated with this resource for subscription billing';
