const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// All booking routes
router.post('/itinerary/:itineraryId/request', bookingController.requestGuidesForItinerary);
router.post('/', bookingController.createBooking);
router.get('/guide/:guideId', bookingController.getGuideBookings);
router.get('/tourist/:touristId', bookingController.getTouristBookings);
router.get('/:id/messages', bookingController.getBookingMessages);
router.post('/:id/messages', bookingController.sendBookingMessage);
router.put('/:id/quote', bookingController.quotePrice);
router.put('/:id/accept', bookingController.acceptQuote);
router.put('/:id/reject', bookingController.rejectQuote);
router.put('/:id/cancel', bookingController.cancelBooking);
router.get('/guide/:guideId/notifications', bookingController.getNotificationCount);

module.exports = router;
