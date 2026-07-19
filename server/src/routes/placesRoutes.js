const express = require('express');
const router = express.Router();
const placesController = require('../controllers/placesController');

/**
 * PLACES ROUTES
 * Public routes for browsing travel destinations.
 * No authentication required for GET requests.
 */

/**
 * GET /api/places
 * Fetch all places with optional search/filter
 * Query parameters:
 *   - search: Search term to filter by name/description
 *   - category: Category to filter by
 */
router.get('/', placesController.getPlaces);

router.get('/:id/reviews', placesController.getPlaceReviews);
router.post('/:id/reviews', placesController.createPlaceReview);
router.delete('/:id/reviews/:reviewId', placesController.deletePlaceReview);

/**
 * GET /api/places/:id
 * Fetch single place by ID
 * Path parameters:
 *   - id: The place ID
 */
router.get('/:id', placesController.getPlaceDetail);

module.exports = router;
