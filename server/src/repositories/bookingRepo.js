const db = require('../config/db');

/**
 * BOOKING REPOSITORY
 * Handles database operations for the booking/notification system
 */

async function createBooking(itineraryId, guideId, touristId, notes) {
    try {
        const result = await db.query(
            `INSERT INTO bookings (itinerary_id, guide_id, tourist_id, notes, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [itineraryId, guideId, touristId, notes]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

async function getBookingById(bookingId) {
    try {
        const result = await db.query(
            `SELECT * FROM bookings WHERE id = $1`,
            [bookingId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching booking by ID:', error);
        throw error;
    }
}

async function getBookingMessages(bookingId) {
    try {
        const result = await db.query(
            `SELECT bm.id, bm.booking_id, bm.author_id, bm.message, bm.created_at, u.email as author_email
             FROM booking_messages bm
             LEFT JOIN users u ON bm.author_id = u.id
             WHERE bm.booking_id = $1
             ORDER BY bm.created_at ASC`,
            [bookingId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching booking messages:', error);
        throw error;
    }
}

async function createBookingMessage(bookingId, authorId, message) {
    try {
        const result = await db.query(
            `INSERT INTO booking_messages (booking_id, author_id, message)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [bookingId, authorId, message]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating booking message:', error);
        throw error;
    }
}

async function getGuideBookings(guideId) {
    try {
        const result = await db.query(
            `SELECT b.*, i.title as itinerary_title, i.start_date, i.end_date,
                    u.email as tourist_email, tp.full_name as tourist_name, tp.contact_number as tourist_contact,
                    COALESCE(
                        (SELECT json_agg(json_build_object(
                            'place_id', p.id,
                            'name', p.name,
                            'category', p.category,
                            'visit_order', ii.visit_order
                        ) ORDER BY ii.visit_order)
                         FROM itinerary_items ii
                         JOIN places p ON ii.place_id = p.id
                         WHERE ii.itinerary_id = i.id), '[]'::json) as itinerary_places
             FROM bookings b
             JOIN itineraries i ON b.itinerary_id = i.id
             JOIN users u ON b.tourist_id = u.id
             JOIN tourist_profiles tp ON b.tourist_id = tp.user_id
             WHERE b.guide_id = $1
             ORDER BY b.created_at DESC`,
            [guideId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching guide bookings:', error);
        throw error;
    }
}

async function getTouristBookings(touristId) {
    try {
        const result = await db.query(
            `SELECT b.*, i.title as itinerary_title, gp.full_name as guide_name, gp.contact_number as guide_contact, u.email as guide_email
             FROM bookings b
             JOIN itineraries i ON b.itinerary_id = i.id
             JOIN users u ON b.guide_id = u.id
             JOIN guide_profiles gp ON b.guide_id = gp.user_id
             WHERE b.tourist_id = $1
             ORDER BY b.created_at DESC`,
            [touristId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching tourist bookings:', error);
        throw error;
    }
}

async function updateBookingStatus(bookingId, status, price = null) {
    try {
        let query = `UPDATE bookings SET status = $1`;
        let params = [status, bookingId];

        if (price !== null) {
            query += `, quoted_price = $3`;
            params.push(price);
        }

        query += ` WHERE id = $2 RETURNING *`;
        
        const result = await db.query(query, params);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
}

async function getPendingGuideNotificationsCount(guideId) {
    try {
        const result = await db.query(
            `SELECT COUNT(*) FROM bookings WHERE guide_id = $1 AND (status = 'pending' OR status = 'accepted')`,
            [guideId]
        );
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error('Error counting guide notifications:', error);
        throw error;
    }
}

module.exports = {
    createBooking,
    getBookingById,
    getBookingMessages,
    createBookingMessage,
    getGuideBookings,
    getTouristBookings,
    updateBookingStatus,
    getPendingGuideNotificationsCount
};
