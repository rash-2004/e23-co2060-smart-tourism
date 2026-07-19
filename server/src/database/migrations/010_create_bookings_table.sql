-- Migration: Create bookings table
-- Description: Stores booking requests between tourists and guides

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
    guide_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tourist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, quoted, accepted, rejected, cancelled
    quoted_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
