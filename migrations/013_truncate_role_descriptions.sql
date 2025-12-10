-- Migration: Truncate Owner, Editor, Viewer role descriptions
-- Removes inheritance text from role descriptions for universal control plane roles

UPDATE ktrlplane.roles
SET description = 'Full control with inheritance'
WHERE role_id = '10000000-0001-0000-0000-000000000001';

UPDATE ktrlplane.roles
SET description = 'Edit access with inheritance'
WHERE role_id = '10000000-0001-0000-0000-000000000002';

UPDATE ktrlplane.roles
SET description = 'Read-only access with inheritance'
WHERE role_id = '10000000-0001-0000-0000-000000000003';
