-- Remove unique constraint from email
ALTER TABLE ktrlplane.users DROP CONSTRAINT IF EXISTS users_email_key;

-- Add index on email for lookup performance
CREATE INDEX IF NOT EXISTS idx_users_email ON ktrlplane.users(email);

-- Remove external_auth_id column as it is redundant (same as user_id)
ALTER TABLE ktrlplane.users DROP COLUMN IF EXISTS external_auth_id;
