const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');

/**
 * TRAVEL GUIDE ROUTES
 * Public routes to browse and view travel guides
 */

// Get all guides
router.get('/', guideController.getAllGuides);

// Suggest guides for itinerary
router.get('/suggest/:itineraryId', guideController.suggestGuidesForItinerary);

// Get guide by ID
router.get('/:id', guideController.getGuideById);

// Guide Reviews
router.get('/:id/reviews', guideController.getGuideReviews);
router.post('/:id/reviews', guideController.createGuideReview);
router.delete('/:id/reviews/:reviewId', guideController.deleteGuideReview);

module.exports = router;
