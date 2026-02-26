const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const verifyToken = require('../middleware/authMiddleware');

// PUBLIC: Anyone can see the list of places
router.get('/', placeController.getPlaces);

// PROTECTED: You must be logged in to add a new place
router.post('/', verifyToken, placeController.addPlace);

module.exports = router;