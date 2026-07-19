-- Migration: Add covered_locations to guide_profiles
-- Description: Adds a column to store the locations a guide covers

ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS covered_locations TEXT;
