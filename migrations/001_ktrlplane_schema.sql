-- Clean migration: Drop everything and create fresh ktrlplane schema
-- This migration creates a dedicated schema and implements the simplified RBAC design

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.role_assignments CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create dedicated ktrlplane schema
CREATE SCHEMA IF NOT EXISTS ktrlplane;

-- Set search path to use ktrlplane schema by default
SET search_path TO ktrlplane, public;

-- Users table (for Auth0 integration)
CREATE TABLE ktrlplane.users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    external_auth_id VARCHAR(255), -- Auth0 subject
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations table (multi-tenancy)
CREATE TABLE ktrlplane.organizations (
    org_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table (now includes org_id)
CREATE TABLE ktrlplane.projects (
    project_id VARCHAR(255) PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL REFERENCES ktrlplane.organizations(org_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Resources table (updated with proper type)
CREATE TABLE ktrlplane.resources (
    resource_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES ktrlplane.projects(project_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'Konnektr.Graph',
    status VARCHAR(50) DEFAULT 'Creating',
    helm_values JSONB DEFAULT '{}',
    error_message TEXT,
    access_url VARCHAR(1024),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RBAC Tables

-- Roles table (simplified: 3 universal roles + data plane roles)
CREATE TABLE ktrlplane.roles (
    role_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions table (simplified: control plane + data plane permissions)
CREATE TABLE ktrlplane.permissions (
    permission_id VARCHAR(255) PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL, -- 'Konnektr.KtrlPlane' or 'Konnektr.DigitalTwins'
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(resource_type, action)
);

-- Role-Permission mapping
CREATE TABLE ktrlplane.role_permissions (
    role_id VARCHAR(255) REFERENCES ktrlplane.roles(role_id) ON DELETE CASCADE,
    permission_id VARCHAR(255) REFERENCES ktrlplane.permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Role assignments (polymorphic scope)
CREATE TABLE ktrlplane.role_assignments (
    assignment_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES ktrlplane.users(user_id) ON DELETE CASCADE,
    role_id VARCHAR(255) NOT NULL REFERENCES ktrlplane.roles(role_id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL, -- 'organization', 'project', 'resource'
    scope_id VARCHAR(255) NOT NULL,
    assigned_by VARCHAR(255) NOT NULL REFERENCES ktrlplane.users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NULL,
    
    UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- Insert UNIVERSAL CONTROL PLANE permissions
INSERT INTO ktrlplane.permissions (permission_id, resource_type, action, description, created_at) VALUES
-- Universal control plane permissions (work across all entities via inheritance)
('00000000-0001-0000-0000-000000000001', 'Konnektr.KtrlPlane', 'read', 'Read platform entity details (orgs, projects, resources)', NOW()),
('00000000-0001-0000-0000-000000000002', 'Konnektr.KtrlPlane', 'write', 'Modify platform entity details and deploy resources', NOW()),
('00000000-0001-0000-0000-000000000003', 'Konnektr.KtrlPlane', 'delete', 'Delete platform entities', NOW()),
('00000000-0001-0000-0000-000000000004', 'Konnektr.KtrlPlane', 'manage_access', 'Manage access and permissions for platform entities', NOW()),

-- DATA PLANE permissions (application-specific for Konnektr.DigitalTwins)
('00000000-0004-0000-0000-000000000001', 'Konnektr.DigitalTwins', 'twins.read', 'Read digital twins data', NOW()),
('00000000-0004-0000-0000-000000000002', 'Konnektr.DigitalTwins', 'twins.write', 'Create and modify digital twins', NOW()),
('00000000-0004-0000-0000-000000000003', 'Konnektr.DigitalTwins', 'relationships.read', 'Read twin relationships', NOW()),
('00000000-0004-0000-0000-000000000004', 'Konnektr.DigitalTwins', 'relationships.write', 'Create and modify twin relationships', NOW()),
('00000000-0004-0000-0000-000000000005', 'Konnektr.DigitalTwins', 'models.read', 'Read digital twin models', NOW()),
('00000000-0004-0000-0000-000000000006', 'Konnektr.DigitalTwins', 'models.write', 'Create and modify digital twin models', NOW()),
('00000000-0004-0000-0000-000000000007', 'Konnektr.DigitalTwins', 'queries.execute', 'Execute queries against twin data', NOW()),
('00000000-0004-0000-0000-000000000008', 'Konnektr.DigitalTwins', 'manage_access', 'Manage application-level access and permissions', NOW());

-- Insert UNIVERSAL CONTROL PLANE roles (3 simple roles with inheritance)
INSERT INTO ktrlplane.roles (role_id, name, display_name, description, is_system, created_at, updated_at) VALUES
-- Universal control plane roles (inherit down the hierarchy)
('10000000-0001-0000-0000-000000000001', 'Owner', 'Owner', 'Full control with inheritance (Org Owner → Project Owner → Resource Owner)', true, NOW(), NOW()),
('10000000-0001-0000-0000-000000000002', 'Editor', 'Editor', 'Edit access with inheritance (Org Editor → Project Editor → Resource Editor)', true, NOW(), NOW()),
('10000000-0001-0000-0000-000000000003', 'Viewer', 'Viewer', 'Read-only access with inheritance (Org Viewer → Project Viewer → Resource Viewer)', true, NOW(), NOW()),

-- DATA PLANE roles (application-specific)
('10000000-0004-0000-0000-000000000001', 'Konnektr.DigitalTwins.Owner', 'DigitalTwins Owner', 'Full access to DigitalTwins application and data', true, NOW(), NOW()),
('10000000-0004-0000-0000-000000000002', 'Konnektr.DigitalTwins.Editor', 'DigitalTwins Editor', 'Edit access to DigitalTwins application and data', true, NOW(), NOW()),
('10000000-0004-0000-0000-000000000003', 'Konnektr.DigitalTwins.Viewer', 'DigitalTwins Viewer', 'Read-only access to DigitalTwins application', true, NOW(), NOW());

-- Map permissions to UNIVERSAL CONTROL PLANE roles
-- Owner (all permissions)
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0001-0000-0000-000000000001', '00000000-0001-0000-0000-000000000001'), -- read
('10000000-0001-0000-0000-000000000001', '00000000-0001-0000-0000-000000000002'), -- write  
('10000000-0001-0000-0000-000000000001', '00000000-0001-0000-0000-000000000003'), -- delete
('10000000-0001-0000-0000-000000000001', '00000000-0001-0000-0000-000000000004'); -- manage_access

-- Editor (read, write - no delete or manage_access)
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0001-0000-0000-000000000002', '00000000-0001-0000-0000-000000000001'), -- read
('10000000-0001-0000-0000-000000000002', '00000000-0001-0000-0000-000000000002'); -- write

-- Viewer (read only)
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0001-0000-0000-000000000003', '00000000-0001-0000-0000-000000000001'); -- read

-- Map permissions to DATA PLANE roles (Konnektr.DigitalTwins)
-- DigitalTwins Owner (all application permissions)
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000001'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000002'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000003'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000004'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000005'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000006'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000007'),
('10000000-0004-0000-0000-000000000001', '00000000-0004-0000-0000-000000000008');

-- DigitalTwins Editor (all except manage_access)
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000001'),
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000002'),
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000003'),
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000004'),
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000005'),
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000006'),
('10000000-0004-0000-0000-000000000002', '00000000-0004-0000-0000-000000000007');

-- DigitalTwins Viewer (read only)
INSERT INTO ktrlplane.role_permissions (role_id, permission_id) VALUES
('10000000-0004-0000-0000-000000000003', '00000000-0004-0000-0000-000000000001'),
('10000000-0004-0000-0000-000000000003', '00000000-0004-0000-0000-000000000003'),
('10000000-0004-0000-0000-000000000003', '00000000-0004-0000-0000-000000000005'),
('10000000-0004-0000-0000-000000000003', '00000000-0004-0000-0000-000000000007');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON ktrlplane.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_resources_project_id ON ktrlplane.resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON ktrlplane.resources(status);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id ON ktrlplane.role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_scope ON ktrlplane.role_assignments(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON ktrlplane.permissions(resource_type, action);
