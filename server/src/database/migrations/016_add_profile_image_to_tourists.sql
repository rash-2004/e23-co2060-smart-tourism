-- Migration: 016_add_profile_image_to_tourists.sql
-- Add profile_image_url to tourist_profiles table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tourist_profiles' AND column_name='profile_image_url') THEN
        ALTER TABLE tourist_profiles ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;
