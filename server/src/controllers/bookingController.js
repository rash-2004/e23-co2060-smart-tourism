const bookingRepo = require('../repositories/bookingRepo');
const userRepo = require('../repositories/userRepo');
const itineraryRepo = require('../repositories/itineraryRepo');
const notificationRepo = require('../repositories/notificationRepo');

async function requestGuidesForItinerary(req, res) {
    try {
        const { itineraryId } = req.params;
        const { touristId, notes } = req.body;

        const itinerary = await itineraryRepo.getItineraryById(itineraryId);
        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        const locationNames = [...new Set(itinerary.places.map(p => p.name))];

        const potentialGuides = await userRepo.findGuidesByLocations(locationNames);

        if (potentialGuides.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No guides found for these locations' 
            });
        }

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
        const { price, currency } = req.body;

        if (!price) {
            return res.status(400).json({ error: 'Price is required' });
        }

        const booking = await bookingRepo.updateBookingStatus(id, 'quoted', price, currency || 'LKR');
        if (booking) {
             await notificationRepo.createNotification(
                 booking.tourist_id,
                 'quote_received',
                 'New Quote Received',
                 `A guide has offered a quote of ${currency || 'LKR'} ${price} for your booking request.`,
                 booking.id
             );
             const io = req.app.get('io');
             if (io) io.to(`user_${booking.tourist_id}`).emit('global_notification', { type: 'quote_received', bookingId: id });
        }
        res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Error quoting price:', error);
        res.status(500).json({ error: 'Failed to quote price' });
    }
}

async function acceptQuote(req, res) {
    try {
        const { id } = req.params;
        const booking = await bookingRepo.updateBookingStatus(id, 'accepted');
        if (booking) {
             await notificationRepo.createNotification(
                 booking.guide_id,
                 'quote_accepted',
                 'Quote Accepted',
                 `Your quote for booking #${booking.id} was accepted by the tourist!`,
                 booking.id
             );
             const io = req.app.get('io');
             if (io) io.to(`user_${booking.guide_id}`).emit('global_notification', { type: 'quote_accepted', bookingId: id });
        }
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept quote' });
    }
}

async function rejectQuote(req, res) {
    try {
        const { id } = req.params;
        const booking = await bookingRepo.updateBookingStatus(id, 'rejected');
        if (booking) {
             await notificationRepo.createNotification(
                 booking.guide_id,
                 'quote_rejected',
                 'Quote Rejected',
                 `Your quote for booking #${booking.id} was rejected by the tourist.`,
                 booking.id
             );
             const io = req.app.get('io');
             if (io) io.to(`user_${booking.guide_id}`).emit('global_notification', { type: 'quote_rejected', bookingId: id });
        }
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
        
        const io = req.app.get('io');
        if (io) {
            io.to(`booking_${id}`).emit('new_message', savedMessage);
            
            // Emit to global recipient room
            try {
                const booking = await bookingRepo.getBookingById(id);
                if (booking) {
                    const recipientId = String(authorId) === String(booking.guide_id) ? booking.tourist_id : booking.guide_id;
                    
                    await notificationRepo.createNotification(
                        recipientId,
                        'new_message',
                        'New Message Received',
                        `You have received a new message for booking #${booking.id}.`,
                        booking.id
                    );

                    io.to(`user_${recipientId}`).emit('global_notification', { type: 'new_message', bookingId: id });
                }
            } catch (err) {
                console.error('Failed to send global notification:', err);
            }
        }

        res.status(201).json({ success: true, message: savedMessage });
    } catch (error) {
        console.error('Send booking message error:', error);
        res.status(500).json({ error: 'Failed to send booking message' });
    }
}

async function editBookingMessage(req, res) {
    try {
        const { id, messageId } = req.params;
        const authorId = req.user?.id || req.body.authorId;
        const { message } = req.body;

        if (!authorId || !message) {
            return res.status(400).json({ error: 'authorId and message are required' });
        }

        const existingMessage = await bookingRepo.getBookingMessageById(messageId);
        if (!existingMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (existingMessage.author_id !== authorId) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }

        const messageTime = new Date(existingMessage.created_at).getTime();
        const currentTime = new Date().getTime();
        const oneHour = 60 * 60 * 1000;

        if (currentTime - messageTime > oneHour) {
            return res.status(400).json({ error: 'Messages can only be edited within 1 hour of sending' });
        }

        if (existingMessage.is_deleted) {
             return res.status(400).json({ error: 'Cannot edit a deleted message' });
        }

        const updatedMessage = await bookingRepo.updateBookingMessage(messageId, message);

        const io = req.app.get('io');
        if (io) {
            io.to(`booking_${id}`).emit('edit_message', updatedMessage);
        }

        res.status(200).json({ success: true, message: updatedMessage });
    } catch (error) {
        console.error('Edit booking message error:', error);
        res.status(500).json({ error: 'Failed to edit booking message' });
    }
}

async function deleteBookingMessage(req, res) {
    try {
        const { id, messageId } = req.params;
        const authorId = req.user?.id || req.body.authorId;

        if (!authorId) {
            return res.status(400).json({ error: 'authorId is required' });
        }

        const existingMessage = await bookingRepo.getBookingMessageById(messageId);
        if (!existingMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (existingMessage.author_id !== authorId) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        const messageTime = new Date(existingMessage.created_at).getTime();
        const currentTime = new Date().getTime();
        const oneHour = 60 * 60 * 1000;

        if (currentTime - messageTime > oneHour) {
            return res.status(400).json({ error: 'Messages can only be deleted within 1 hour of sending' });
        }

        const deletedMessage = await bookingRepo.deleteBookingMessage(messageId);

        const io = req.app.get('io');
        if (io) {
            io.to(`booking_${id}`).emit('delete_message', deletedMessage);
        }

        res.status(200).json({ success: true, message: deletedMessage });
    } catch (error) {
        console.error('Delete booking message error:', error);
        res.status(500).json({ error: 'Failed to delete booking message' });
    }
}

async function cancelBooking(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body.authorId || null;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const booking = await bookingRepo.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.tourist_id !== userId) {
            return res.status(403).json({ error: 'You can only cancel your own bookings' });
        }

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

async function deleteBooking(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body.authorId || null;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const booking = await bookingRepo.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.tourist_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own bookings' });
        }
        if (!['cancelled', 'rejected'].includes(booking.status)) {
            return res.status(400).json({ error: 'Only cancelled or rejected bookings can be deleted' });
        }

        await bookingRepo.deleteBooking(id);
        res.status(200).json({ success: true, message: 'Booking deleted' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
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
    editBookingMessage,
    deleteBookingMessage,
    cancelBooking,
    deleteBooking,
    getNotificationCount
};
