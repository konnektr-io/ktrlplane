-- 019_add_graph_relationships_permissions.sql
-- Migration: Add digitaltwins/relationships/* permissions to existing data plane Owner roles

SET search_path TO ktrlplane, public;

INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000021'), -- Graph Owner digitaltwins/relationships/*
('10000000-0005-0000-0000-000000000001', '00000000-0004-0000-0000-000000000021'), -- Data Owner digitaltwins/relationships/*