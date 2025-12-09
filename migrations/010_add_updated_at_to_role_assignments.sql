-- 010_add_updated_at_to_role_assignments.sql
-- Migration: Add updated_at column to role_assignments table for tracking role transfers

SET search_path TO ktrlplane, public;

-- Add updated_at column to role_assignments
ALTER TABLE ktrlplane.role_assignments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing rows to have updated_at = created_at
UPDATE ktrlplane.role_assignments 
SET updated_at = created_at 
WHERE updated_at IS NULL;
