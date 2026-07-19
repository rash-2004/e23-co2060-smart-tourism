-- 012_update_quoted_price_type.sql
-- Change quoted_price from DECIMAL to VARCHAR to support currency symbols and flexible pricing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bookings'
          AND column_name = 'quoted_price'
          AND data_type <> 'character varying'
    ) THEN
        ALTER TABLE bookings ALTER COLUMN quoted_price TYPE VARCHAR(50);
    END IF;
END$$;
