const userRepo = require('../repositories/userRepo');

/**
 * GUIDE CONTROLLER
 * Handles travel guide related public operations
 */

/**
 * GET /api/guides
 * Fetch all verified/active travel guides
 */
async function getAllGuides(req, res) {
    try {
        const guides = await userRepo.getAllGuides();
        
        res.status(200).json({
            success: true,
            guides
        });
    } catch (error) {
        console.error('Error fetching guides:', error);
        res.status(500).json({ error: 'Failed to fetch travel guides' });
    }
}

/**
 * GET /api/guides/:id
 * Fetch a specific guide's portfolio
 */
async function getGuideById(req, res) {
    try {
        const { id } = req.params;
        const guide = await userRepo.getUserProfile(id);
        
        if (!guide) {
            return res.status(404).json({ error: 'Guide not found' });
        }
        
        res.status(200).json({
            success: true,
            guide
        });
    } catch (error) {
        console.error('Error fetching guide:', error);
        res.status(500).json({ error: 'Failed to fetch guide details' });
    }
}

/**
 * GET /api/guides/suggest/:itineraryId
 * Suggest suitable guides based on itinerary places
 */
async function suggestGuidesForItinerary(req, res) {
    try {
        const { itineraryId } = req.params;
        
        if (!itineraryId) {
            return res.status(400).json({ error: 'itineraryId is required' });
        }

        const suggestedGuides = await userRepo.suggestGuidesForItinerary(itineraryId);
        
        res.status(200).json({
            success: true,
            message: `Found ${suggestedGuides.length} suitable guides for this itinerary`,
            guides: suggestedGuides
        });
    } catch (error) {
        console.error('Error suggesting guides:', error);
        res.status(500).json({ error: 'Failed to suggest guides for itinerary' });
    }
}

async function getGuideReviews(req, res) {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid guide ID' });
        }

        const reviews = await userRepo.getGuideReviews(parseInt(id));
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching guide reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
}

async function createGuideReview(req, res) {
    try {
        const { id } = req.params;
        const { tourist_id, rating, comment } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid guide ID' });
        }
        if (!tourist_id || isNaN(tourist_id)) {
            return res.status(400).json({ success: false, error: 'tourist_id is required' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        }

        const review = await userRepo.createGuideReview(
            parseInt(id),
            parseInt(tourist_id),
            parseInt(rating),
            comment || ''
        );

        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error('Error creating guide review:', error);
        res.status(500).json({ success: false, error: 'Failed to submit review' });
    }
}

async function deleteGuideReview(req, res) {
    try {
        const { reviewId } = req.params;
        const result = await userRepo.deleteGuideReview(parseInt(reviewId));
        if (!result) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting guide review:', error);
        res.status(500).json({ success: false, error: 'Failed to delete review' });
    }
}

module.exports = {
    getAllGuides,
    getGuideById,
    suggestGuidesForItinerary,
    getGuideReviews,
    createGuideReview,
    deleteGuideReview
};
