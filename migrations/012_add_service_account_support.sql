-- 012_add_service_account_support.sql
-- Migration: Add service account support for M2M permission checking
-- This enables M2M applications to check permissions on behalf of users

SET search_path TO ktrlplane, public;

-- Add is_hidden column to roles table to exclude internal/service roles from user listings
ALTER TABLE ktrlplane.roles 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Create the service account permission checker role
-- This role is hidden from general role listings as it's for internal service use only
INSERT INTO ktrlplane.roles (role_id, name, display_name, description, is_system, is_hidden, display_order, created_at, updated_at)
VALUES (
  'service-account-permission-checker',
  'Service Account: Permission Checker',
  'Service Account: Permission Checker',
  'Allows service accounts to check permissions on behalf of users. This is an internal role for M2M authentication.',
  true,
  true,  -- Hidden from user-facing role listings
  1000,
  NOW(),
  NOW()
)
ON CONFLICT (role_id) DO NOTHING;

-- Create the special permission for checking permissions on behalf of users
INSERT INTO ktrlplane.permissions (permission_id, resource_type, action, description, created_at)
VALUES (
  '00000000-0001-0000-0000-000000000006',
  'Konnektr.KtrlPlane',
  'check_permissions_on_behalf_of',
  'Check user permissions on behalf of users (service accounts only)',
  NOW()
)
ON CONFLICT (resource_type, action) DO NOTHING;

-- Map the permission to the service account role
INSERT INTO ktrlplane.role_permissions (role_id, permission_id)
VALUES ('service-account-permission-checker', '00000000-0001-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- Create a user entry for the M2M service account
-- M2M tokens are detected by the auth middleware and skip normal user creation
-- But the user_id must exist in the users table for the foreign key constraint
INSERT INTO ktrlplane.users (user_id, email, name, created_at, updated_at)
VALUES (
  '90TsN4J1Y1KQ1NWgy8PJjKp3mx7lH6Ig',
  'service-account@ktrlplane.system',
  'KtrlPlane M2M Service Account',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Assign the role to the KtrlPlane M2M application
-- Client ID: 90TsN4J1Y1KQ1NWgy8PJjKp3mx7lH6Ig
INSERT INTO ktrlplane.role_assignments (
  assignment_id,
  user_id,
  role_id,
  scope_type,
  scope_id,
  assigned_by,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '90TsN4J1Y1KQ1NWgy8PJjKp3mx7lH6Ig',  -- M2M client ID (becomes the 'sub' claim in M2M tokens)
  'service-account-permission-checker',
  'global',
  'global',
  '90TsN4J1Y1KQ1NWgy8PJjKp3mx7lH6Ig',  -- Self-assigned (assigned_by must reference existing user)
  NOW(),
  NOW()
)
ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING;

-- Create index for is_hidden flag for efficient filtering
CREATE INDEX IF NOT EXISTS idx_roles_is_hidden ON ktrlplane.roles(is_hidden) WHERE is_hidden = false;

-- Comment on the new column
COMMENT ON COLUMN ktrlplane.roles.is_hidden IS 'When true, this role is hidden from general role listings (used for internal/service roles)';
