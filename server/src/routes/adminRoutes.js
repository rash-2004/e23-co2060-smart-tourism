const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Tourist management
router.get('/tourists', adminController.getTourists);
router.delete('/tourists/:id', adminController.deleteTourist);

// Guide management
router.get('/guides', adminController.getGuides);
router.delete('/guides/:id', adminController.deleteGuide);

// Comment management
router.get('/comments/places', adminController.getPlaceComments);
router.delete('/comments/places/:id', adminController.deletePlaceComment);
router.get('/comments/guides', adminController.getGuideComments);
router.delete('/comments/guides/:id', adminController.deleteGuideComment);

module.exports = router;
