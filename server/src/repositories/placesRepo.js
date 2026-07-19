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
                p.id, 
                p.name, 
                p.description, 
                p.latitude, 
                p.longitude, 
                p.category, 
                p.image_url,
                p.created_at,
                COALESCE(AVG(pr.rating), 0) AS average_rating,
                COUNT(pr.id) AS review_count
            FROM places p
            LEFT JOIN place_reviews pr ON p.id = pr.place_id
            GROUP BY p.id
            ORDER BY 
                COUNT(pr.id) DESC,
                average_rating DESC,
                RANDOM()
            LIMIT 20
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
                p.id, 
                p.name, 
                p.description, 
                p.latitude, 
                p.longitude, 
                p.category, 
                p.image_url,
                p.created_at,
                COALESCE(AVG(pr.rating), 0) AS average_rating,
                COUNT(pr.id) AS review_count
            FROM places p
            LEFT JOIN place_reviews pr ON p.id = pr.place_id
            WHERE p.id = $1
            GROUP BY p.id
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
                p.id, 
                p.name, 
                p.description, 
                p.latitude, 
                p.longitude, 
                p.category, 
                p.image_url,
                p.created_at,
                COALESCE(AVG(pr.rating), 0) AS average_rating,
                COUNT(pr.id) AS review_count
            FROM places p
            LEFT JOIN place_reviews pr ON p.id = pr.place_id
            WHERE p.name ILIKE $1 OR p.description ILIKE $1
            GROUP BY p.id
            ORDER BY average_rating DESC, p.name ASC
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
                p.id, 
                p.name, 
                p.description, 
                p.latitude, 
                p.longitude, 
                p.category, 
                p.image_url,
                p.created_at,
                COALESCE(AVG(pr.rating), 0) AS average_rating,
                COUNT(pr.id) AS review_count
            FROM places p
            LEFT JOIN place_reviews pr ON p.id = pr.place_id
            WHERE p.category ILIKE $1
            GROUP BY p.id
            ORDER BY average_rating DESC, p.name ASC
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
                   u.id as user_id,
                   tp.full_name as tourist_name
            FROM place_reviews pr
            JOIN users u ON pr.tourist_id = u.id
            LEFT JOIN tourist_profiles tp ON pr.tourist_id = tp.user_id
            WHERE pr.place_id = $1
            ORDER BY pr.created_at DESC
        ` : `
            SELECT pr.id,
                   pr.rating,
                   pr.comment,
                   pr.created_at,
                   u.email as user_email,
                   u.id as user_id,
                   tp.full_name as tourist_name
            FROM place_reviews pr
            JOIN users u ON pr.tourist_id = u.id
            LEFT JOIN tourist_profiles tp ON pr.tourist_id = tp.user_id
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
            WITH inserted AS (
                INSERT INTO place_reviews (place_id, tourist_id, rating, title, comment)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            )
            SELECT i.*, u.email as user_email, tp.full_name as tourist_name
            FROM inserted i
            JOIN users u ON i.tourist_id = u.id
            LEFT JOIN tourist_profiles tp ON i.tourist_id = tp.user_id
        ` : `
            WITH inserted AS (
                INSERT INTO place_reviews (place_id, tourist_id, rating, comment)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            )
            SELECT i.*, u.email as user_email, tp.full_name as tourist_name
            FROM inserted i
            JOIN users u ON i.tourist_id = u.id
            LEFT JOIN tourist_profiles tp ON i.tourist_id = tp.user_id
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
                WITH inserted AS (
                    INSERT INTO place_reviews (place_id, tourist_id, rating, comment)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                )
                SELECT i.*, u.email as user_email, tp.full_name as tourist_name
                FROM inserted i
                JOIN users u ON i.tourist_id = u.id
                LEFT JOIN tourist_profiles tp ON i.tourist_id = tp.user_id
            `;
            const result = await db.query(retryQuery, [placeId, touristId, rating, comment]);
            return result.rows[0];
        }
        console.error('Error creating place review:', error);
        throw error;
    }
}

async function deletePlaceReview(reviewId) {
    try {
        const query = 'DELETE FROM place_reviews WHERE id = $1 RETURNING *';
        const result = await db.query(query, [reviewId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting place review:', error);
        throw error;
    }
}

module.exports = {
    getAllPlaces,
    getPlaceById,
    searchPlaces,
    getPlacesByCategory,
    getPlaceReviews,
    createPlaceReview,
    deletePlaceReview
};
