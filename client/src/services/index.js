import API from './api';

// Auth Services
export const authService = {
  login: (email, password) => API.post('/api/auth/login', { email, password }),
  register: (email, password, role) => API.post('/api/auth/register', { email, password, role }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Place Services
export const placeService = {
  getAllPlaces: () => API.get('/api/places'),
  getPlaceById: (id) => API.get(`/api/places/${id}`),
  createPlace: (data) => API.post('/api/places', data),
  updatePlace: (id, data) => API.put(`/api/places/${id}`, data),
  deletePlace: (id) => API.delete(`/api/places/${id}`),
  searchPlaces: (query) => API.get(`/api/places/search?q=${query}`),
  getPlacesByLocation: (lat, lon, distance) => 
    API.get(`/api/places/nearby?latitude=${lat}&longitude=${lon}&distance=${distance}`)
};

// Travel Guide Services
export const guideService = {
  getAllGuides: () => API.get('/api/guides'),
  getGuideById: (id) => API.get(`/api/guides/${id}`),
  suggestGuidesForItinerary: (itineraryId) => API.get(`/api/guides/suggest/${itineraryId}`),
  createGuide: (data) => API.post('/api/guides', data),
  getGuidePortfolio: (guideId) => API.get(`/api/guides/${guideId}/portfolio`),
  rateGuide: (guideId, rating) => API.post(`/api/guides/${guideId}/rate`, { rating })
};

// Itinerary Services
export const itineraryService = {
  getUserItineraries: (touristId) => API.get(`/api/users/${touristId}/itineraries`),
  getItineraryById: (id) => API.get(`/api/itineraries/${id}`),
  createItinerary: (data) => API.post('/api/itineraries', data),
  updateItinerary: (id, data) => API.put(`/api/itineraries/${id}`, data),
  deleteItinerary: (id) => API.delete(`/api/itineraries/${id}`),
  addPlaceToItinerary: (itineraryId, placeId) => 
    API.post(`/api/itineraries/${itineraryId}/places`, { place_id: placeId }),
  removePlaceFromItinerary: (itineraryId, placeId) => 
    API.delete(`/api/itineraries/${itineraryId}/places/${placeId}`),
  reorderPlaces: (itineraryId, order) => 
    API.put(`/api/itineraries/${itineraryId}/reorder`, { order })
};

// Booking Services
export const bookingService = {
  requestGuides: (itineraryId, data) => API.post(`/api/bookings/itinerary/${itineraryId}/request`, data),
  createBooking: (data) => API.post('/api/bookings', data),
  getGuideBookings: (guideId) => API.get(`/api/bookings/guide/${guideId}`),
  getTouristBookings: (touristId) => API.get(`/api/bookings/tourist/${touristId}`),
  quotePrice: (bookingId, price, currency) => API.put(`/api/bookings/${bookingId}/quote`, { price, currency }),
  acceptQuote: (bookingId) => API.put(`/api/bookings/${bookingId}/accept`),
  rejectQuote: (bookingId) => API.put(`/api/bookings/${bookingId}/reject`),
  cancelBooking: (bookingId, data = {}) => API.put(`/api/bookings/${bookingId}/cancel`, data),
  deleteBooking: (bookingId, data = {}) => API.delete(`/api/bookings/${bookingId}`, { data }),
  getBookingMessages: (bookingId) => API.get(`/api/bookings/${bookingId}/messages`),
  sendBookingMessage: (bookingId, data) => API.post(`/api/bookings/${bookingId}/messages`, data),
  editBookingMessage: (bookingId, messageId, data) => API.put(`/api/bookings/${bookingId}/messages/${messageId}`, data),
  deleteBookingMessage: (bookingId, messageId, data = {}) => API.delete(`/api/bookings/${bookingId}/messages/${messageId}`, { data }),
  getNotificationCount: (guideId) => API.get(`/api/bookings/guide/${guideId}/notifications`)
};

// Review Services
export const reviewService = {
  getPlaceReviews: (placeId) => API.get(`/api/places/${placeId}/reviews`),
  createReview: (placeId, data) => API.post(`/api/places/${placeId}/reviews`, data),
  deletePlaceReview: (placeId, reviewId) => API.delete(`/api/places/${placeId}/reviews/${reviewId}`),
  getGuideReviews: (guideId) => API.get(`/api/guides/${guideId}/reviews`),
  createGuideReview: (guideId, data) => API.post(`/api/guides/${guideId}/reviews`, data),
  deleteGuideReview: (guideId, reviewId) => API.delete(`/api/guides/${guideId}/reviews/${reviewId}`),
  updateReview: (reviewId, data) => API.put(`/api/reviews/${reviewId}`, data),
  deleteReview: (reviewId) => API.delete(`/api/reviews/${reviewId}`) // Keep for legacy
};

// Profile Services
export const profileService = {
  // Fetch profile for a specific user ID (tourist or guide)
  getProfile: (userId) => API.get(`/api/users/${userId}/profile`),

  // Update profile depending on role. Tourist and guide endpoints differ on the server.
  // Expects the caller to pass the current user's role so we know which URL to hit.
  updateProfile: (userId, data, role = 'tourist') => {
    if (role === 'guide') {
      // guide updates live under /api/users/:id/guide-profile
      return API.post(`/api/users/${userId}/guide-profile`, data);
    }
    // default to tourist profile update which lives at /api/users/:id/profile
    return API.post(`/api/users/${userId}/profile`, data);
  },

  // Delete user account permanently
  deleteAccount: (userId) => API.delete(`/api/users/${userId}/account`),

  // legacy helper if you ever need to fetch by profile id directly
  getProfileById: (userId) => API.get(`/api/profiles/${userId}`),

  // Get dashboard statistics for a user
  getUserStats: (userId) => API.get(`/api/users/${userId}/stats`)
};

// System Services
export const systemService = {
  getStatus: () => API.get('/api/system/status')
};

// Notification Services
export const notificationService = {
  getUserNotifications: (userId) => API.get(`/api/notifications/${userId}`),
  getUnreadCount: (userId) => API.get(`/api/notifications/${userId}/unread-count`),
  markAllAsRead: (userId) => API.put(`/api/notifications/${userId}/mark-all-read`),
  markAsRead: (userId, notificationId) => API.put(`/api/notifications/${userId}/${notificationId}/read`)
};
