-- 009_add_konnektr_data_owner_role.sql
-- Migration: Add Konnektr.Data.Owner role with all data plane permissions for all resource types
-- For now, this grants all Konnektr.Graph data plane permissions (same as Konnektr.Graph.Owner)

-- Set search path to use ktrlplane schema by default
SET search_path TO ktrlplane, public;

-- Insert new DATA OWNER role
INSERT INTO ktrlplane.roles (role_id, name, display_name, description, is_system, created_at, updated_at) VALUES
('10000000-0005-0000-0000-000000000001', 'Konnektr.Data.Owner', 'Data Owner', 'Full access to all data plane resources (all resource types)', true, NOW(), NOW());

-- Grant all Konnektr.Graph data plane permissions to Konnektr.Data.Owner
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0005-0000-0000-000000000001', '00000000-0004-0000-0000-000000000008'), -- digitaltwins/*
('10000000-0005-0000-0000-000000000001', '00000000-0004-0000-0000-000000000012'), -- models/*
('10000000-0005-0000-0000-000000000001', '00000000-0004-0000-0000-000000000014'), -- query/*
('10000000-0005-0000-0000-000000000001', '00000000-0004-0000-0000-000000000022'); -- jobs/*

