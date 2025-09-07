-- Migration: Add SKU/tier support to resources
-- This migration adds SKU/tier field to resources table and updates configuration

SET search_path TO ktrlplane, public;

-- Add SKU/tier field to resources table
ALTER TABLE ktrlplane.resources ADD COLUMN IF NOT EXISTS sku VARCHAR(50) DEFAULT 'free';

-- Create index for SKU queries
CREATE INDEX IF NOT EXISTS idx_resources_sku ON ktrlplane.resources(sku);

-- Update existing resources to have 'free' SKU
UPDATE ktrlplane.resources SET sku = 'free' WHERE sku IS NULL;
