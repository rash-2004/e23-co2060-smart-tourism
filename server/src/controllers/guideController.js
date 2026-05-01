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

module.exports = {
    getAllGuides,
    getGuideById,
    suggestGuidesForItinerary
};
