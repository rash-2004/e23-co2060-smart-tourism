-- 014_add_unique_itinerary_place_constraint.sql
-- Ensure a place cannot be added more than once to the same itinerary

WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY itinerary_id, place_id ORDER BY id) AS row_num
    FROM itinerary_items
)
DELETE FROM itinerary_items
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i'
          AND c.relname = 'idx_itinerary_items_itinerary_place'
    ) THEN
        CREATE UNIQUE INDEX idx_itinerary_items_itinerary_place
        ON itinerary_items(itinerary_id, place_id);
    END IF;
END$$;
