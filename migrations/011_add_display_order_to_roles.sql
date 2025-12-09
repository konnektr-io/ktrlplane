-- 011_add_display_order_to_roles.sql
-- Migration: Add display_order column to roles table for consistent UI ordering

SET search_path TO ktrlplane, public;

-- Add display_order column to roles
ALTER TABLE ktrlplane.roles 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- Update display_order for existing roles
-- Universal control plane roles (1-10)
UPDATE ktrlplane.roles SET display_order = 1 WHERE name = 'Owner';
UPDATE ktrlplane.roles SET display_order = 2 WHERE name = 'Editor';
UPDATE ktrlplane.roles SET display_order = 3 WHERE name = 'Viewer';

-- Data Owner role (20)
UPDATE ktrlplane.roles SET display_order = 20 WHERE name = 'Konnektr.Data.Owner';

-- Resource-specific roles (30+)
UPDATE ktrlplane.roles SET display_order = 30 WHERE name = 'Konnektr.Graph.Owner';
UPDATE ktrlplane.roles SET display_order = 31 WHERE name = 'Konnektr.Graph.Viewer';

-- Future roles can use:
-- - 10-19 for additional universal roles
-- - 21-29 for additional cross-resource data roles
-- - 30+ for resource-specific roles (incrementing for each new product)

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_roles_display_order ON ktrlplane.roles(display_order);
