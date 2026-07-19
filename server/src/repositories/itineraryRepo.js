const db = require('../config/db');

/**
 * ITINERARY REPOSITORY
 * Database operations for itineraries and itinerary items
 */

async function createItinerary(touristId, title, startDate, endDate, places = []) {
    try {
        const result = await db.query(
            `INSERT INTO itineraries (tourist_id, title, start_date, end_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [touristId, title, startDate, endDate]
        );

        const itinerary = result.rows[0];

        // Add places if provided
        if (places && places.length > 0) {
            for (let i = 0; i < places.length; i++) {
                await db.query(
                    `INSERT INTO itinerary_items (itinerary_id, place_id, visit_order, notes)
                     VALUES ($1, $2, $3, $4)`,
                    [itinerary.id, places[i].id, i + 1, places[i].notes || '']
                );
            }
        }

        return await getItineraryById(itinerary.id);
    } catch (error) {
        console.error('Error creating itinerary:', error);
        throw error;
    }
}

async function getItineraryById(itineraryId) {
    try {
        const itinerary = await db.query(
            `SELECT * FROM itineraries WHERE id = $1`,
            [itineraryId]
        );

        if (!itinerary.rows[0]) {
            return null;
        }

        const items = await db.query(
            `SELECT ii.id as item_id, ii.place_id, ii.visit_order, ii.notes,
                    p.id, p.name, p.description, p.latitude, p.longitude, p.category, p.image_url
             FROM itinerary_items ii
             JOIN places p ON ii.place_id = p.id
             WHERE ii.itinerary_id = $1
             ORDER BY ii.visit_order ASC`,
            [itineraryId]
        );

        return {
            ...itinerary.rows[0],
            places: items.rows
        };
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        throw error;
    }
}

async function getTouristItineraries(touristId) {
    try {
        const result = await db.query(
            `SELECT * FROM itineraries WHERE tourist_id = $1 ORDER BY id DESC`,
            [touristId]
        );

        // For each itinerary, get its places
        const itineraries = await Promise.all(
            result.rows.map(async (itinerary) => {
                const items = await db.query(
                    `SELECT ii.id as item_id, ii.place_id, ii.visit_order, ii.notes,
                            p.id, p.name, p.description, p.latitude, p.longitude, p.category, p.image_url
                     FROM itinerary_items ii
                     JOIN places p ON ii.place_id = p.id
                     WHERE ii.itinerary_id = $1
                     ORDER BY ii.visit_order ASC`,
                    [itinerary.id]
                );
                return {
                    ...itinerary,
                    places: items.rows
                };
            })
        );

        return itineraries;
    } catch (error) {
        console.error('Error fetching tourist itineraries:', error);
        throw error;
    }
}

async function updateItinerary(itineraryId, title, startDate, endDate) {
    try {
        const result = await db.query(
            `UPDATE itineraries
             SET title = $1, start_date = $2, end_date = $3
             WHERE id = $4
             RETURNING *`,
            [title, startDate, endDate, itineraryId]
        );

        if (!result.rows[0]) {
            return null;
        }

        return await getItineraryById(itineraryId);
    } catch (error) {
        console.error('Error updating itinerary:', error);
        throw error;
    }
}

async function deleteItinerary(itineraryId) {
    try {
        // Delete will cascade to itinerary_items
        await db.query(
            `DELETE FROM itineraries WHERE id = $1`,
            [itineraryId]
        );
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        throw error;
    }
}

async function addPlaceToItinerary(itineraryId, placeId, visitOrder, notes) {
    try {
        const existingItem = await db.query(
            `SELECT * FROM itinerary_items WHERE itinerary_id = $1 AND place_id = $2`,
            [itineraryId, placeId]
        );

        if (existingItem.rows.length > 0) {
            return { ...existingItem.rows[0], already_exists: true };
        }

        // If visit_order not provided, get the max and add 1
        if (!visitOrder) {
            const maxOrder = await db.query(
                `SELECT MAX(visit_order) as max_order FROM itinerary_items WHERE itinerary_id = $1`,
                [itineraryId]
            );
            visitOrder = (maxOrder.rows[0].max_order || 0) + 1;
        }

        const result = await db.query(
            `INSERT INTO itinerary_items (itinerary_id, place_id, visit_order, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [itineraryId, placeId, visitOrder, notes || '']
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error adding place to itinerary:', error);
        throw error;
    }
}

async function removePlaceFromItinerary(itineraryId, placeId) {
    try {
        await db.query(
            `DELETE FROM itinerary_items 
             WHERE itinerary_id = $1 AND place_id = $2`,
            [itineraryId, placeId]
        );
    } catch (error) {
        console.error('Error removing place from itinerary:', error);
        throw error;
    }
}

module.exports = {
    createItinerary,
    getItineraryById,
    getTouristItineraries,
    updateItinerary,
    deleteItinerary,
    addPlaceToItinerary,
    removePlaceFromItinerary
};
