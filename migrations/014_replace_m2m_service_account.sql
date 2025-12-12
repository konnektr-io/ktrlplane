-- 014_replace_m2m_service_account.sql
-- Migration: Remove old M2M service account and add new one for correct client ID
-- Date: 2025-12-12

SET search_path TO ktrlplane, public;

-- Remove old M2M service account and its role assignment
DELETE FROM ktrlplane.role_assignments WHERE user_id = '90TsN4J1Y1KQ1NWgy8PJjKp3mx7lH6Ig' AND role_id = 'service-account-permission-checker' AND scope_type = 'global' AND scope_id = 'global';
DELETE FROM ktrlplane.users WHERE user_id = '90TsN4J1Y1KQ1NWgy8PJjKp3mx7lH6Ig';

-- Add new M2M service account user
INSERT INTO ktrlplane.users (user_id, email, name, created_at, updated_at)
VALUES (
  'bagOSESRAzp5TG2FQBI33SkOATMrJ88m',
  'service-account@ktrlplane.system',
  'Konnektr M2M Service Account',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Assign the role to the new M2M application
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
  'bagOSESRAzp5TG2FQBI33SkOATMrJ88m',  -- New M2M client ID
  'service-account-permission-checker',
  'global',
  'global',
  'bagOSESRAzp5TG2FQBI33SkOATMrJ88m',  -- Self-assigned
  NOW(),
  NOW()
)
ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING;
