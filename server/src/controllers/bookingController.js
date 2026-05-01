const bookingRepo = require('../repositories/bookingRepo');
const userRepo = require('../repositories/userRepo');
const itineraryRepo = require('../repositories/itineraryRepo');

/**
 * BOOKING CONTROLLER
 * Orchestrates booking-related requests
 */

async function requestGuidesForItinerary(req, res) {
    try {
        const { itineraryId } = req.params;
        const { touristId, notes } = req.body;

        // 1. Fetch the itinerary details
        const itinerary = await itineraryRepo.getItineraryById(itineraryId);
        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        // 2. Extract unique locations from the itinerary
        const locationNames = [...new Set(itinerary.places.map(p => p.name))];
        
        // 3. Find guides who cover these locations
        const potentialGuides = await userRepo.findGuidesByLocations(locationNames);
        
        if (potentialGuides.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No guides found for these locations' 
            });
        }

        // 4. Create booking requests for each guide
        const createdBookings = [];
        for (const guide of potentialGuides) {
            const booking = await bookingRepo.createBooking(itineraryId, guide.user_id, touristId, notes);
            createdBookings.push(booking);
        }

        res.status(201).json({ 
            success: true, 
            message: `Requests sent to ${potentialGuides.length} potential guides`,
            bookings: createdBookings 
        });
    } catch (error) {
        console.error('Request guides error:', error);
        res.status(500).json({ error: 'Failed to request guides' });
    }
}

async function createBooking(req, res) {
    try {
        const { itineraryId, guideId, touristId, notes } = req.body;
        
        if (!itineraryId || !guideId || !touristId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const booking = await bookingRepo.createBooking(itineraryId, guideId, touristId, notes);
        res.status(201).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
}

async function getGuideBookings(req, res) {
    try {
        const { guideId } = req.params;
        const bookings = await bookingRepo.getGuideBookings(guideId);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

async function getTouristBookings(req, res) {
    try {
        const { touristId } = req.params;
        const bookings = await bookingRepo.getTouristBookings(touristId);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

async function quotePrice(req, res) {
    try {
        const { id } = req.params;
        const { price } = req.body;

        if (!price) {
            return res.status(400).json({ error: 'Price is required' });
        }

        const booking = await bookingRepo.updateBookingStatus(id, 'quoted', price);
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to quote price' });
    }
}

async function acceptQuote(req, res) {
    try {
        const { id } = req.params;
        const booking = await bookingRepo.updateBookingStatus(id, 'accepted');
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept quote' });
    }
}

async function rejectQuote(req, res) {
    try {
        const { id } = req.params;
        const booking = await bookingRepo.updateBookingStatus(id, 'rejected');
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject quote' });
    }
}

async function getBookingMessages(req, res) {
    try {
        const { id } = req.params;
        const messages = await bookingRepo.getBookingMessages(id);
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Fetch booking messages error:', error);
        res.status(500).json({ error: 'Failed to fetch booking messages' });
    }
}

async function sendBookingMessage(req, res) {
    try {
        const { id } = req.params;
        const authorId = req.user?.id || req.body.authorId;
        const { message } = req.body;

        if (!authorId || !message) {
            return res.status(400).json({ error: 'authorId and message are required' });
        }

        const savedMessage = await bookingRepo.createBookingMessage(id, authorId, message);
        res.status(201).json({ success: true, message: savedMessage });
    } catch (error) {
        console.error('Send booking message error:', error);
        res.status(500).json({ error: 'Failed to send booking message' });
    }
}

async function cancelBooking(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body.authorId || null;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if the user is the tourist who made the booking
        const booking = await bookingRepo.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.tourist_id !== userId) {
            return res.status(403).json({ error: 'You can only cancel your own bookings' });
        }

        // Only allow cancellation if status is pending or quoted
        if (!['pending', 'quoted'].includes(booking.status)) {
            return res.status(400).json({ error: 'Cannot cancel this booking at this stage' });
        }

        const updatedBooking = await bookingRepo.updateBookingStatus(id, 'cancelled');
        res.status(200).json({ success: true, booking: updatedBooking });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
}

async function getNotificationCount(req, res) {
    try {
        const { guideId } = req.params;
        const count = await bookingRepo.getPendingGuideNotificationsCount(guideId);
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notification count' });
    }
}

module.exports = {
    requestGuidesForItinerary,
    createBooking,
    getGuideBookings,
    getTouristBookings,
    quotePrice,
    acceptQuote,
    rejectQuote,
    getBookingMessages,
    sendBookingMessage,
    cancelBooking,
    getNotificationCount
};
