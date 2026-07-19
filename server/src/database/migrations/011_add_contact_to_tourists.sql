-- 011_add_contact_to_tourists.sql
ALTER TABLE tourist_profiles ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
