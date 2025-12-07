-- Migration to remove description field from projects table
-- This field is no longer used and has been removed from the application

ALTER TABLE ktrlplane.projects DROP COLUMN IF EXISTS description;
