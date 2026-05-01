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
  quotePrice: (bookingId, price) => API.put(`/api/bookings/${bookingId}/quote`, { price }),
  acceptQuote: (bookingId) => API.put(`/api/bookings/${bookingId}/accept`),
  rejectQuote: (bookingId) => API.put(`/api/bookings/${bookingId}/reject`),
  cancelBooking: (bookingId, data = {}) => API.put(`/api/bookings/${bookingId}/cancel`, data),
  getBookingMessages: (bookingId) => API.get(`/api/bookings/${bookingId}/messages`),
  sendBookingMessage: (bookingId, data) => API.post(`/api/bookings/${bookingId}/messages`, data),
  getNotificationCount: (guideId) => API.get(`/api/bookings/guide/${guideId}/notifications`)
};

// Review Services
export const reviewService = {
  getPlaceReviews: (placeId) => API.get(`/api/places/${placeId}/reviews`),
  createReview: (placeId, data) => API.post(`/api/places/${placeId}/reviews`, data),
  updateReview: (reviewId, data) => API.put(`/api/reviews/${reviewId}`, data),
  deleteReview: (reviewId) => API.delete(`/api/reviews/${reviewId}`)
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

  // legacy helper if you ever need to fetch by profile id directly
  getProfileById: (userId) => API.get(`/api/profiles/${userId}`)
};

// System Services
export const systemService = {
  getStatus: () => API.get('/api/system/status')
};
