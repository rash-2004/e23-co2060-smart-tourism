const db = require('../config/db');

/**
 * PLACES REPOSITORY
 * All database queries related to places (travel destinations).
 * Uses parameterized queries to prevent SQL injection.
 */

/**
 * Get all places from database
 * @returns {Promise<Array>} Array of place objects
 */
async function getAllPlaces() {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                description, 
                latitude, 
                longitude, 
                category, 
                image_url,
                created_at
            FROM places
            ORDER BY name ASC
        `;
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching places:', error);
        throw error;
    }
}

/**
 * Get single place by ID
 * @param {number} placeId - The place ID
 * @returns {Promise<Object>} Place object
 */
async function getPlaceById(placeId) {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                description, 
                latitude, 
                longitude, 
                category, 
                image_url,
                created_at
            FROM places
            WHERE id = $1
        `;
        const result = await db.query(query, [placeId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching place:', error);
        throw error;
    }
}

/**
 * Search places by name or description
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching places
 */
async function searchPlaces(searchTerm) {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                description, 
                latitude, 
                longitude, 
                category, 
                image_url,
                created_at
            FROM places
            WHERE name ILIKE $1 OR description ILIKE $1
            ORDER BY name ASC
        `;
        const result = await db.query(query, [`%${searchTerm}%`]);
        return result.rows;
    } catch (error) {
        console.error('Error searching places:', error);
        throw error;
    }
}

/**
 * Get places by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of places in category
 */
async function getPlacesByCategory(category) {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                description, 
                latitude, 
                longitude, 
                category, 
                image_url,
                created_at
            FROM places
            WHERE category = $1
            ORDER BY name ASC
        `;
        const result = await db.query(query, [category]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching places by category:', error);
        throw error;
    }
}

let placeReviewTitleColumnExists = null;

async function hasPlaceReviewTitleColumn() {
    if (placeReviewTitleColumnExists !== null) {
        return placeReviewTitleColumnExists;
    }

    const result = await db.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        ['place_reviews', 'title']
    );

    placeReviewTitleColumnExists = result.rows.length > 0;
    return placeReviewTitleColumnExists;
}

async function getPlaceReviews(placeId) {
    try {
        const includeTitle = await hasPlaceReviewTitleColumn();
        const query = includeTitle ? `
            SELECT pr.id,
                   pr.rating,
                   pr.comment,
                   pr.created_at,
                   pr.title,
                   u.email as user_email,
                   u.id as user_id
            FROM place_reviews pr
            JOIN users u ON pr.tourist_id = u.id
            WHERE pr.place_id = $1
            ORDER BY pr.created_at DESC
        ` : `
            SELECT pr.id,
                   pr.rating,
                   pr.comment,
                   pr.created_at,
                   u.email as user_email,
                   u.id as user_id
            FROM place_reviews pr
            JOIN users u ON pr.tourist_id = u.id
            WHERE pr.place_id = $1
            ORDER BY pr.created_at DESC
        `;

        const result = await db.query(query, [placeId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching place reviews:', error);
        throw error;
    }
}

async function createPlaceReview(placeId, touristId, rating, title, comment) {
    try {
        const includeTitle = await hasPlaceReviewTitleColumn();
        const query = includeTitle ? `
            INSERT INTO place_reviews (place_id, tourist_id, rating, title, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, place_id, tourist_id, rating, title, comment, created_at
        ` : `
            INSERT INTO place_reviews (place_id, tourist_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING id, place_id, tourist_id, rating, comment, created_at
        `;

        const params = includeTitle
            ? [placeId, touristId, rating, title || null, comment]
            : [placeId, touristId, rating, comment];

        const result = await db.query(query, params);
        return result.rows[0];
    } catch (error) {
        if (error.code === '42703') {
            console.warn('Title column missing; retrying insert without title');
            placeReviewTitleColumnExists = false;
            const retryQuery = `
                INSERT INTO place_reviews (place_id, tourist_id, rating, comment)
                VALUES ($1, $2, $3, $4)
                RETURNING id, place_id, tourist_id, rating, comment, created_at
            `;
            const result = await db.query(retryQuery, [placeId, touristId, rating, comment]);
            return result.rows[0];
        }
        console.error('Error creating place review:', error);
        throw error;
    }
}

module.exports = {
    getAllPlaces,
    getPlaceById,
    searchPlaces,
    getPlacesByCategory,
    getPlaceReviews,
    createPlaceReview
};
