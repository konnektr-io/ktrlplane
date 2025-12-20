-- 016_add_graph_mcp_permission.sql
-- Migration: Add new data plane permission for Konnektr.Graph: mcp/*
-- Assign to Konnektr.Graph.Owner and Konnektr.Data.Owner roles
-- Date: 2025-12-13

SET search_path TO ktrlplane, public;

-- Insert new mcp/* data plane permission for Konnektr.Graph
INSERT INTO ktrlplane.permissions (
    permission_id, resource_type, action, description, created_at
) VALUES (
    '00000000-0004-0000-0000-000000000030',
    'Konnektr.Graph',
    'mcp/*',
    'Full access to MCP server for Konnektr.Graph',
    NOW()
)
ON CONFLICT (permission_id) DO NOTHING;

-- Assign mcp/* permission to Konnektr.Graph.Owner
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
    ('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000030')
ON CONFLICT DO NOTHING;

-- Assign mcp/* permission to Konnektr.Data.Owner
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
    ('10000000-0005-0000-0000-000000000001', '00000000-0004-0000-0000-000000000030')
ON CONFLICT DO NOTHING;
