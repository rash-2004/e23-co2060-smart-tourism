-- 015_add_title_to_place_reviews_if_missing.sql
-- Add title column to place_reviews if it is missing

ALTER TABLE place_reviews
ADD COLUMN IF NOT EXISTS title TEXT;
