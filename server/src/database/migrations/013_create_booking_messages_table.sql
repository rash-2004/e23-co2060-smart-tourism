-- Migration: Create booking messages table
-- Description: Stores chat-style messages for booking requests between tourists and guides

CREATE TABLE IF NOT EXISTS booking_messages (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
