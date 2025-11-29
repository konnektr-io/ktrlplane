-- Migration: Allow projects without a parent organization
ALTER TABLE ktrlplane.projects
  ALTER COLUMN org_id DROP NOT NULL;
