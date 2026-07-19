const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const itineraryController = require('../controllers/itineraryController');

/**
 * USER ROUTES
 * Routes for user profile management
 */

// Get user profile
router.get('/:id/profile', userController.getUserProfile);

// Update tourist profile
router.post('/:id/profile', userController.updateTouristProfile);

// Update guide profile
router.post('/:id/guide-profile', userController.updateGuideProfile);

// Delete user account permanently
router.delete('/:id/account', userController.deleteAccount);

// Get all itineraries for a tourist
router.get('/:tourist_id/itineraries', itineraryController.getTouristItineraries);

// Get dashboard stats for a user
router.get('/:id/stats', userController.getUserStats);

// Change user password
router.post('/:id/change-password', userController.changePassword);

module.exports = router;
