const db = require('../config/db');

// Check if an email is already in the database
const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await db.query(query, [email]);
    return result.rows[0];
};

// Insert a new user into the database
const createUser = async (email, passwordHash, role) => {
    const query = `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role, created_at;
    `;
    // If no role is provided, default to 'tourist'
    const values = [email, passwordHash, role || 'tourist'];
    const result = await db.query(query, values);
    return result.rows[0]; // Returns the newly created user (without the password!)
};

// Get user by ID
const getUserById = async (userId) => {
    const query = `SELECT id, email, role, is_verified, created_at FROM users WHERE id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows[0];
};

// Get user profile (tourist or guide)
const getUserProfile = async (userId) => {
    try {
        const userRole = await db.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        if (!userRole.rows[0]) {
            return null;
        }

        const role = userRole.rows[0].role;
        let query = '';
        
        if (role === 'guide') {
            query = `
                SELECT u.created_at as joined_at, u.email, gp.* 
                FROM users u
                LEFT JOIN guide_profiles gp ON u.id = gp.user_id
                WHERE u.id = $1
            `;
        } else {
            query = `
                SELECT u.created_at as joined_at, u.email, tp.* 
                FROM users u
                LEFT JOIN tourist_profiles tp ON u.id = tp.user_id
                WHERE u.id = $1
            `;
        }

        const result = await db.query(query, [userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

// Update or create tourist profile
const updateTouristProfile = async (userId, fullName, nationality, contactNumber, profileImageUrl) => {
    try {
        const result = await db.query(
            `INSERT INTO tourist_profiles (user_id, full_name, nationality, contact_number, profile_image_url)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id) DO UPDATE SET full_name = $2, nationality = $3, contact_number = $4, profile_image_url = $5
             RETURNING *`,
            [userId, fullName, nationality, contactNumber, profileImageUrl]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error updating tourist profile:', error);
        throw error;
    }
};

// Update or create guide profile
const updateGuideProfile = async (userId, fullName, bio, licenseNumber, hourlyRate, contactNumber, profileImageUrl, specialization, experienceYears, languages, coveredLocations) => {
    try {
        const result = await db.query(
            `INSERT INTO guide_profiles (user_id, full_name, bio, license_number, hourly_rate, contact_number, profile_image_url, specialization, experience_years, languages, covered_locations)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (user_id) DO UPDATE SET 
                full_name = $2, 
                bio = $3, 
                license_number = $4, 
                hourly_rate = $5,
                contact_number = $6,
                profile_image_url = $7,
                specialization = $8,
                experience_years = $9,
                languages = $10,
                covered_locations = $11
             RETURNING *`,
            [userId, fullName, bio, licenseNumber, hourlyRate, contactNumber, profileImageUrl, specialization, experienceYears, languages, coveredLocations]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error updating guide profile:', error);
        throw error;
    }
};

// Get all guides
const getAllGuides = async () => {
    try {
        const query = `
            SELECT 
                gp.*, 
                u.email,
                COALESCE(AVG(gr.rating), 0) AS average_rating,
                COUNT(gr.id) AS review_count
            FROM guide_profiles gp
            JOIN users u ON gp.user_id = u.id
            LEFT JOIN guide_reviews gr ON gp.user_id = gr.guide_id
            WHERE u.role = 'guide'
            GROUP BY gp.id, u.id
            ORDER BY 
                COUNT(gr.id) DESC,
                average_rating DESC,
                RANDOM()
            LIMIT 20
        `;
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all guides:', error);
        throw error;
    }
};

// Suggest guides based on itinerary places
const suggestGuidesForItinerary = async (itineraryId) => {
    try {
        // First, get all places in the itinerary
        const placesQuery = `
            SELECT p.name, p.category
            FROM itinerary_items ii
            JOIN places p ON ii.place_id = p.id
            WHERE ii.itinerary_id = $1
            ORDER BY ii.visit_order
        `;
        const placesResult = await db.query(placesQuery, [itineraryId]);
        const places = placesResult.rows;

        if (places.length === 0) {
            return [];
        }

        // Get place names for matching
        const placeNames = places.map(p => p.name.toLowerCase());
        const placeCategories = [...new Set(places.map(p => p.category))]; // Unique categories

        // Find guides whose covered_locations match the places
        const guidesQuery = `
            SELECT gp.*, u.email,
                   CASE WHEN gp.covered_locations IS NOT NULL THEN 1 ELSE 0 END as has_locations
            FROM guide_profiles gp
            JOIN users u ON gp.user_id = u.id
            WHERE u.role = 'guide'
        `;
        const guidesResult = await db.query(guidesQuery);
        const allGuides = guidesResult.rows;

        // Filter and score guides based on location coverage
        const scoredGuides = allGuides.map(guide => {
            let score = 0;
            let matchedPlaces = [];

            if (guide.covered_locations) {
                const coveredLocations = guide.covered_locations.toLowerCase().split(',').map(loc => loc.trim());

                // Check for exact place name matches
                placeNames.forEach(placeName => {
                    if (coveredLocations.some(loc => loc.includes(placeName) || placeName.includes(loc))) {
                        score += 10; // High score for direct place match
                        matchedPlaces.push(placeName);
                    }
                });

                // Check for category specialization match
                if (guide.specialization && placeCategories.includes(guide.specialization)) {
                    score += 5;
                }

                // Bonus for experience
                if (guide.experience_years) {
                    score += Math.min(guide.experience_years, 10); // Max 10 points for experience
                }
            }

            return {
                ...guide,
                match_score: score,
                matched_places: matchedPlaces,
                covered_locations_array: guide.covered_locations ? guide.covered_locations.split(',').map(loc => loc.trim()) : []
            };
        });

        const suggestedGuides = scoredGuides
          .filter(guide => guide.matched_places.length > 0)
          .sort((a, b) => {
              // Primary sort: number of matched places (descending)
              if (b.matched_places.length !== a.matched_places.length) {
                  return b.matched_places.length - a.matched_places.length;
              }
              // Secondary sort: match score (descending)
              return b.match_score - a.match_score;
          });

        return suggestedGuides;
    } catch (error) {
        console.error('Error suggesting guides for itinerary:', error);
        throw error;
    }
};

// Find guides by covered locations
const findGuidesByLocations = async (locationNames) => {
    try {
        if (!locationNames || locationNames.length === 0) return [];
        
        const conditions = locationNames.map((_, i) => `gp.covered_locations ILIKE '%' || $${i + 1} || '%'`).join(' OR ');
        
        const query = `
            SELECT gp.*, u.email 
            FROM guide_profiles gp
            JOIN users u ON gp.user_id = u.id
            WHERE u.role = 'guide' AND (${conditions})
        `;
        
        const result = await db.query(query, locationNames);
        return result.rows;
    } catch (error) {
        console.error('Error finding guides by locations:', error);
        throw error;
    }
};

// Delete user account and all related data (cascade delete due to foreign key constraints)
const deleteUser = async (userId) => {
    try {
        const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// Get dashboard stats for a user
const getUserStats = async (userId) => {
    try {
        // Count itineraries
        const itinerariesRes = await db.query(
            'SELECT COUNT(*) FROM itineraries WHERE tourist_id = $1',
            [userId]
        );
        
        // Count reviews
        const reviewsRes = await db.query(
            'SELECT COUNT(*) FROM place_reviews WHERE tourist_id = $1',
            [userId]
        );

        // Experience Points (XP) Calculation: 
        // 50 XP per itinerary, 20 XP per review
        const itineraryCount = parseInt(itinerariesRes.rows[0].count);
        const reviewCount = parseInt(reviewsRes.rows[0].count);
        const xp = (itineraryCount * 50) + (reviewCount * 20);

        return {
            itineraries: itineraryCount,
            reviews: reviewCount,
            savedPlaces: 0, // Placeholder
            xp: xp || 0
        };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
};

// Get reviews for a guide
const getGuideReviews = async (guideId) => {
    try {
        const query = `
            SELECT gr.id,
                   gr.rating,
                   gr.comment,
                   gr.created_at,
                   u.email as user_email,
                   u.id as user_id,
                   tp.full_name as tourist_name
            FROM guide_reviews gr
            JOIN users u ON gr.tourist_id = u.id
            LEFT JOIN tourist_profiles tp ON gr.tourist_id = tp.user_id
            WHERE gr.guide_id = $1
            ORDER BY gr.created_at DESC
        `;
        const result = await db.query(query, [guideId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching guide reviews:', error);
        throw error;
    }
};

// Create a review for a guide
const createGuideReview = async (guideId, touristId, rating, comment) => {
    try {
        const query = `
            WITH inserted AS (
                INSERT INTO guide_reviews (guide_id, tourist_id, rating, comment)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            )
            SELECT i.*, u.email as user_email, tp.full_name as tourist_name
            FROM inserted i
            JOIN users u ON i.tourist_id = u.id
            LEFT JOIN tourist_profiles tp ON i.tourist_id = tp.user_id
        `;
        const result = await db.query(query, [guideId, touristId, rating, comment]);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating guide review:', error);
        throw error;
    }
};

const deleteGuideReview = async (reviewId) => {
    try {
        const query = 'DELETE FROM guide_reviews WHERE id = $1 RETURNING *';
        const result = await db.query(query, [reviewId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting guide review:', error);
        throw error;
    }
};

module.exports = { 
    findUserByEmail, 
    createUser,
    getUserById,
    getUserProfile,
    updateTouristProfile,
    updateGuideProfile,
    getAllGuides,
    suggestGuidesForItinerary,
    findGuidesByLocations,
    deleteUser,
    getUserStats,
    getGuideReviews,
    createGuideReview,
    deleteGuideReview
};