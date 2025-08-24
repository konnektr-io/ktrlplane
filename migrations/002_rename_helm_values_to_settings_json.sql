-- Migration: Rename helm_values to settings_json in ktrlplane.resources
-- Reason: Make resource settings generic (not Helm-specific)

ALTER TABLE ktrlplane.resources RENAME COLUMN helm_values TO settings_json;

-- If there are any references in triggers, views, or indexes, update them as well.
-- No data migration needed since type remains JSONB.
