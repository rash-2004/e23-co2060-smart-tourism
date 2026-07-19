const placesRepo = require('../repositories/placesRepo');

/**
 * PLACES CONTROLLER
 * Handles requests related to travel destinations/places.
 * Orchestrates between routes and database repository.
 */

/**
 * GET /api/places
 * Fetch all places (with optional search filter)
 */
async function getPlaces(req, res) {
    try {
        const { search, category } = req.query;

        let places;

        if (search) {
            // If search parameter provided, search for matching places
            places = await placesRepo.searchPlaces(search);
        } else if (category) {
            // If category parameter provided, filter by category
            places = await placesRepo.getPlacesByCategory(category);
        } else {
            // Return all places
            places = await placesRepo.getAllPlaces();
        }

        // Return success response
        res.status(200).json({
            success: true,
            data: places,
            count: places.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in getPlaces controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch places',
            error: error.message
        });
    }
}

/**
 * GET /api/places/:id
 * Fetch single place by ID
 */
async function getPlaceDetail(req, res) {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid place ID'
            });
        }

        const place = await placesRepo.getPlaceById(parseInt(id));

        if (!place) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        res.status(200).json({
            success: true,
            data: place,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in getPlaceDetail controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch place details',
            error: error.message
        });
    }
}

async function getPlaceReviews(req, res) {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid place ID' });
        }

        const reviews = await placesRepo.getPlaceReviews(parseInt(id));
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching place reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
}

async function createPlaceReview(req, res) {
    try {
        const { id } = req.params;
        const { tourist_id, rating, title, comment } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid place ID' });
        }
        if (!tourist_id || isNaN(tourist_id)) {
            return res.status(400).json({ success: false, error: 'tourist_id is required' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        }
        if (!title) {
            return res.status(400).json({ success: false, error: 'Review title is required' });
        }

        const review = await placesRepo.createPlaceReview(
            parseInt(id),
            parseInt(tourist_id),
            parseInt(rating),
            title,
            comment || ''
        );

        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error('Error creating place review:', error);
        res.status(500).json({ success: false, error: 'Failed to submit review' });
    }
}
async function deletePlaceReview(req, res) {
    try {
        const { reviewId } = req.params;
        const result = await placesRepo.deletePlaceReview(parseInt(reviewId));
        if (!result) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting place review:', error);
        res.status(500).json({ success: false, error: 'Failed to delete review' });
    }
}

module.exports = {
    getPlaces,
    getPlaceDetail,
    getPlaceReviews,
    createPlaceReview,
    deletePlaceReview
};
