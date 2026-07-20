-- 018_add_currency_to_bookings.sql
-- Add currency column to bookings table to support multi-currency quotes

DO $$$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bookings'
          AND column_name = 'currency'
    ) THEN
        ALTER TABLE bookings ADD COLUMN currency VARCHAR(10) DEFAULT 'LKR';
    END IF;
END$$$;
