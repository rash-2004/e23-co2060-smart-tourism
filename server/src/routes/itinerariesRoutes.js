const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');

/**
 * ITINERARIES ROUTES
 * Routes for managing travel itineraries
 */

// Create a new itinerary
router.post('/', itineraryController.createItinerary);

// Get single itinerary
router.get('/:id', itineraryController.getItinerary);

// Update itinerary
router.put('/:id', itineraryController.updateItinerary);

// Delete itinerary
router.delete('/:id', itineraryController.deleteItinerary);

// Add place to itinerary
router.post('/:itinerary_id/places', itineraryController.addPlaceToItinerary);

// Remove place from itinerary
router.delete('/:itinerary_id/places/:place_id', itineraryController.removePlaceFromItinerary);

module.exports = router;
