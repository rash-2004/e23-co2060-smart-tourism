import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlace } from '../context/PlaceContext';
import { itineraryService, placeService, bookingService, guideService } from '../services';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { 
  FaRoute, FaClock, FaMoneyBillWave, FaBullseye, FaSearch, 
  FaTimes, FaCalendarAlt, FaPhone, FaImage, FaExclamationTriangle,
  FaMapMarkerAlt, FaPlus, FaTrash, FaPaperPlane, FaChevronDown
} from 'react-icons/fa';
import './ItineraryPage.css';

// GraphHopper free demo key — replace with your own from graphhopper.com
const GRAPHHOPPER_API_KEY = 'f8512521-29f8-40cc-ad0a-64bed3f3c40b';

const fetchGraphHopperRoute = async (coordPairs, attempt = 1) => {
  if (coordPairs.length < 2) return null;
  const pointsParam = coordPairs
    .map(([lat, lng]) => `point=${lat},${lng}`)
    .join('&');
  const url = `https://graphhopper.com/api/1/route?${pointsParam}&vehicle=car&locale=en&calc_points=true&points_encoded=true&instructions=false&key=${GRAPHHOPPER_API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok) {
      // Professional Hack: If a point is unreachable by car (off-road), the API returns "Cannot find point X".
      // We catch this, remove that specific point from the routing request, and try again.
      // This ensures 90% of the route still looks professional even if one point is messy.
      const match = data.message?.match(/Cannot find point (\d+)/);
      if (match && attempt < 3 && coordPairs.length > 2) {
        const pointIdx = parseInt(match[1]);
        console.warn(`Routing: Point ${pointIdx} is off-road. Retrying without it...`);
        const reducedCoords = [...coordPairs];
        reducedCoords.splice(pointIdx, 1);
        return fetchGraphHopperRoute(reducedCoords, attempt + 1);
      }
      throw new Error(`GraphHopper request failed (${res.status}): ${data.message || 'unknown error'}`);
    }
    
    if (!data.paths || !data.paths.length) throw new Error('No route found');
    const path = data.paths[0];

    let points;
    if (typeof path.points === 'string') {
      points = decodePolyline(path.points);
    } else if (path.points?.coordinates) {
      points = path.points.coordinates.map(([lng, lat]) => [lat, lng]);
    } else if (Array.isArray(path.points)) {
      points = path.points.map(([lng, lat]) => [lat, lng]);
    } else {
      throw new Error('Unsupported GraphHopper point format');
    }

    return {
      points,
      distanceKm: (path.distance / 1000).toFixed(1),
      durationMin: Math.round(path.time / 60000),
    };
  } catch (err) {
    throw err;
  }
};

// Google-style encoded polyline decoder
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
};

const PRICE_PER_KM = 120; // LKR per km (mock rate)

// Fix for default Leaflet marker icons in React
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ItineraryPage = () => {
  const [searchParams] = useSearchParams();
  const placeToAddParam = searchParams.get('add');
  const guideSuggestionsRef = useRef(null);
  const { user } = useAuth();
  const { places } = usePlace();
  const navigate = useNavigate();

  // Core State
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newItinerary, setNewItinerary] = useState({ title: '', startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // UI State
  const [showAddPlaceDropdown, setShowAddPlaceDropdown] = useState(false);
  const [searchPlaceTerm, setSearchPlaceTerm] = useState('');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState(null);
  const [pendingPlaceToAddId, setPendingPlaceToAddId] = useState(null);
  const [targetItineraryId, setTargetItineraryId] = useState(null);

  const searchCategories = [
    { id: 'Historical', icon: '🏛️' },
    { id: 'Religious', icon: '🙏' },
    { id: 'Nature', icon: '🌿' },
    { id: 'Tourist Attraction', icon: '🏞️' },
    { id: 'Cultural', icon: '🎭' }
  ];

  const filteredPlaces = availablePlaces.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchPlaceTerm.toLowerCase()) || 
                         p.category?.toLowerCase().includes(searchPlaceTerm.toLowerCase());
    const matchesCat = !selectedSearchCategory || p.category === selectedSearchCategory;
    return matchesSearch && matchesCat;
  });

  const showSearchResults = searchPlaceTerm.length > 0 || selectedSearchCategory !== null;
  const [placeAddError, setPlaceAddError] = useState('');

  // GraphHopper Route State
  const [ghRoute, setGhRoute] = useState(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState('');

  // Guide Suggestions State
  const [suggestedGuides, setSuggestedGuides] = useState([]);
  const [showGuideSuggestions, setShowGuideSuggestions] = useState(false);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [noGuidesFound, setNoGuidesFound] = useState(false);

  const [touristBookings, setTouristBookings] = useState([]);
  const [bookingMessagesByBooking, setBookingMessagesByBooking] = useState({});
  const [messageTextByBooking, setMessageTextByBooking] = useState({});
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const loadPlaces = useCallback(async () => {
    try {
      if (places && places.length > 0) {
        setAvailablePlaces(places);
      } else {
        const response = await placeService.getAllPlaces();
        setAvailablePlaces(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading places:', err);
    }
  }, [places]);

  const fetchItineraries = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await itineraryService.getUserItineraries(user.id);
      const data = response.data.data || [];
      setItineraries(data);

      // Keep selection stable without making this callback depend on selectedItinerary
      setSelectedItinerary((prev) => {
        if (prev) {
          const updated = data.find((it) => it.id === prev.id);
          return updated || prev;
        }
        return data.length > 0 ? data[0] : null;
      });
    } catch (err) {
      setError('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTouristBookings = useCallback(async () => {
    if (user?.role !== 'tourist') return;
    try {
      const response = await bookingService.getTouristBookings(user.id);
      setTouristBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Error loading tourist bookings:', err);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user && user.role === 'guide') {
      navigate('/dashboard');
      return;
    }
    fetchItineraries();
    loadPlaces();
    fetchTouristBookings();

    if (placeToAddParam) {
      setPendingPlaceToAddId(parseInt(placeToAddParam));
      setSuccess('Select an itinerary to add this place');
    }
  }, [user, navigate, loadPlaces, fetchItineraries, fetchTouristBookings, placeToAddParam]);

  useEffect(() => {
    if (showGuideSuggestions && guideSuggestionsRef.current) {
      setTimeout(() => {
        guideSuggestionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showGuideSuggestions]);

  const handleCreateItinerary = async (e) => {
    e.preventDefault();
    if (!newItinerary.title) return setError('Please enter a title');

    try {
      const response = await itineraryService.createItinerary({
        tourist_id: user.id,
        title: newItinerary.title,
        start_date: newItinerary.startDate || null,
        end_date: newItinerary.endDate || null
      });
      const created = response.data.itinerary || response.data.data;
      setItineraries([...itineraries, created]);
      setSelectedItinerary(created);
      setNewItinerary({ title: '', startDate: '', endDate: '' });
      setSuccess('Itinerary created successfully!');
      setShowCreateModal(false);
      
      const placeToAddId = placeToAddParam;
      if (placeToAddId) handleAddPlaceToItinerary(created.id, parseInt(placeToAddId));
    } catch (err) {
      setError('Failed to create itinerary');
    }
  };

  const handleAddPlaceToItinerary = useCallback(async (itineraryId, placeId, clearQuery = false) => {
    try {
      await itineraryService.addPlaceToItinerary(itineraryId, placeId);
      setSuccess('Place added to itinerary!');
      setShowAddPlaceDropdown(false);
      setSearchPlaceTerm('');
      setPendingPlaceToAddId(null);
      setTargetItineraryId(null);
      setPlaceAddError('');
      fetchItineraries();
      if (clearQuery) {
        navigate('/itinerary', { replace: true });
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding place to itinerary:', err);
      setError('Failed to add place');
      setPlaceAddError(err.response?.data?.error || 'Failed to add place to itinerary');
    }
  }, [fetchItineraries, navigate]);

  const handleRemovePlace = async (itineraryId, placeId) => {
    try {
      await itineraryService.removePlaceFromItinerary(itineraryId, placeId);
      setSuccess('Place removed');
      fetchItineraries();
    } catch (err) {
      setError('Failed to remove place');
    }
  };

  const handleDeleteItinerary = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await itineraryService.deleteItinerary(id);
        setItineraries(itineraries.filter(it => it.id !== id));
        setSelectedItinerary(null);
        setSuccess('Deleted');
      } catch (err) { setError('Failed to delete'); }
    }
  };

  const handleRequestGuides = async () => {
    if (!selectedItinerary?.places?.length) {
      return setError('Add places first!');
    }

    if (noGuidesFound) {
      navigate('/travel-guides');
      return;
    }
    
    try {
      setLoadingGuides(true);
      setError('');
      
      const response = await guideService.suggestGuidesForItinerary(selectedItinerary.id);
      const guides = response.data.guides || [];
      
      if (guides.length === 0) {
        setSuggestedGuides([]);
        setShowGuideSuggestions(true);
        setNoGuidesFound(true);
        setSuccess('No exact matches found. Click again to browse all guides.');
      } else {
        setSuggestedGuides(guides);
        setShowGuideSuggestions(true);
        setNoGuidesFound(false);
        setSuccess(`Found ${guides.length} suitable guides for your itinerary!`);
      }
    } catch (err) {
      console.error('Error getting guide suggestions:', err);
      setError('Failed to load guide suggestions');
    } finally {
      setLoadingGuides(false);
    }
  };

  const handleBookGuide = async (guideId) => {
    try {
      setLoading(true);
      setError('');
      const notes = `Booking request for itinerary "${selectedItinerary?.title || 'your trip'}"`;
      await bookingService.createBooking({
        itineraryId: selectedItinerary.id,
        guideId,
        touristId: user.id,
        notes
      });
      setSuccess('Guide booking request sent successfully! You can track it below.');
      setShowGuideSuggestions(false);
      await fetchTouristBookings();
    } catch (err) {
      console.error('Error booking guide:', err);
      setError('Failed to send guide booking request.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError('');
      await bookingService.cancelBooking(bookingId, { authorId: user.id });
      setSuccess('Booking request cancelled successfully.');
      await fetchTouristBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking request.');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      setError('');
      await bookingService.deleteBooking(bookingId, { authorId: user.id });
      setSuccess('Booking request deleted successfully.');
      await fetchTouristBookings();
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError(err.response?.data?.error || 'Failed to delete booking request.');
    }
  };

  const fetchBookingMessagesForId = async (bookingId) => {
    try {
      const response = await bookingService.getBookingMessages(bookingId);
      setBookingMessagesByBooking(prev => ({
        ...prev,
        [bookingId]: response.data.messages || []
      }));
    } catch (err) {
      console.error('Error loading booking messages:', err);
    }
  };

  const handleSendBookingMessage = async (bookingId) => {
    const message = messageTextByBooking[bookingId] || '';
    if (!message.trim()) {
      setError('Please enter a message before sending.');
      return;
    }

    try {
      await bookingService.sendBookingMessage(bookingId, {
        authorId: user.id,
        message: message.trim()
      });
      setMessageTextByBooking(prev => ({ ...prev, [bookingId]: '' }));
      fetchBookingMessagesForId(bookingId);
      setSuccess('Message sent to your guide.');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message.');
    }
  };

  // Map Data Helper
  const getMapData = () => {
    if (!selectedItinerary?.places) return { markers: [], polyline: [] };
    const valid = selectedItinerary.places.filter(p => p.latitude && p.longitude);
    const coords = valid.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
    return { markers: valid, polyline: coords };
  };



  const currentItineraryBookings = touristBookings.filter(
    (booking) => booking.itinerary_id === selectedItinerary?.id
  );

  // Fetch GraphHopper route whenever the selected itinerary's places change
  useEffect(() => {
    if (!pendingPlaceToAddId) return;
    if (itineraries.length === 1) {
      handleAddPlaceToItinerary(itineraries[0].id, pendingPlaceToAddId, true);
      return;
    }
    if (itineraries.length > 1 && !targetItineraryId) {
      setTargetItineraryId(itineraries[0]?.id || null);
    }
  }, [pendingPlaceToAddId, itineraries, targetItineraryId, handleAddPlaceToItinerary]);

  useEffect(() => {
    if (selectedItinerary && user?.role === 'tourist') {
      fetchTouristBookings();
    }
  }, [selectedItinerary, user?.role, fetchTouristBookings]);

  useEffect(() => {
    currentItineraryBookings.forEach((booking) => {
      fetchBookingMessagesForId(booking.id);
    });
  }, [currentItineraryBookings]);

  useEffect(() => {
    // 1. Filter for places that actually have coordinates
    const placesWithCoords = (selectedItinerary?.places || []).filter(p => {
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    if (placesWithCoords.length < 2) {
      setGhRoute(null);
      setGhError('');
      return;
    }

    // 2. Map to coordinate pairs and filter out consecutive identical points (API throws error on these)
    const rawCoords = placesWithCoords.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
    const cleanCoords = rawCoords.filter((coord, idx, self) => {
      if (idx === 0) return true;
      const prev = self[idx - 1];
      // Skip if exactly the same as previous (GraphHopper requirement)
      return coord[0] !== prev[0] || coord[1] !== prev[1];
    });

    if (cleanCoords.length < 2) {
      setGhRoute(null);
      setGhError('');
      return;
    }

    setGhLoading(true);
    setGhError('');
    fetchGraphHopperRoute(cleanCoords)
      .then(route => { setGhRoute(route); })
      .catch(err => {
        console.error('GraphHopper error:', err);
        setGhError('Road route unavailable for these locations — showing straight lines.');
        setGhRoute(null);
      })
      .finally(() => setGhLoading(false));
  }, [selectedItinerary?.places]);

  const { markers, polyline } = getMapData();
  const today = new Date().toISOString().split('T')[0];
  const isLinkingPlace = Boolean(placeToAddParam);

  return (
    <main className="itinerary-page">
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div className="itinerary-top-bar" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '20px',
          marginBottom: '40px', 
          background: 'var(--bg-card)', 
          padding: '24px 40px', 
          borderRadius: '24px', 
          border: '1px solid var(--border)', 
          boxShadow: 'var(--shadow)',
          animation: 'modalPop 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-head)', letterSpacing: '-0.03em' }}>Your Itineraries</h2>
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedItinerary?.id || ''}
                onChange={(e) => {
                  const chosen = itineraries.find(it => it.id === parseInt(e.target.value));
                  if (chosen) setSelectedItinerary(chosen);
                }}
                style={{
                  padding: '14px 56px 14px 24px',
                  borderRadius: '16px',
                  border: '2px solid var(--border)',
                  backgroundColor: 'var(--bg-page)',
                  color: 'var(--text-head)',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  appearance: 'none',
                  minWidth: '320px',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                className="itinerary-dropdown-select"
              >
                <option value="" disabled>Select trip to view...</option>
                {itineraries.map(it => (
                  <option key={it.id} value={it.id}>{it.title || 'Untitled Trip'}</option>
                ))}
              </select>
              <FaChevronDown style={{ 
                position: 'absolute', 
                right: '24px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none', 
                fontSize: '0.9rem', 
                color: 'var(--primary)',
                opacity: 0.9
              }} />
            </div>
          </div>

          <button 
            className="create-new-btn"
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 36px',
              borderRadius: '999px',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
              letterSpacing: '-0.01em'
            }}
          >
            <FaPlus /> Create New One
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

                <div className="itinerary-top-bar" style={{ display: 'none' }}></div> {/* Hidden since moved to top */}

        <div className="itinerary-layout" style={{ display: 'block' }}>
          <section className="itinerary-content" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
            {selectedItinerary ? (
              <div className="itinerary-detail">
                <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                  <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '20px' }}>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, lineHeight: 1.1 }}>{selectedItinerary.title}</h1>
                    <p style={{ margin: '8px 0 0', opacity: 0.6, fontSize: '0.95rem' }}>
                      {selectedItinerary.start_date 
                        ? `${new Date(selectedItinerary.start_date).toLocaleDateString()} — ${new Date(selectedItinerary.end_date).toLocaleDateString()}`
                        : 'Custom trip plan'}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteItinerary(selectedItinerary.id)} className="btn btn-danger" style={{ borderRadius: '12px', padding: '10px 20px', fontSize: '0.9rem' }}>Delete Plan</button>
                </div>

                <div className="itinerary-main-section" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', marginBottom: '60px' }}>
                  <div className="map-preview-container" style={{ flex: 1.6, height: '600px' }}>
                  <MapContainer 
                    center={polyline.length > 0 ? polyline[0] : [7.8731, 80.7718]} 
                    zoom={polyline.length > 0 ? 9 : 7} 
                    className="itinerary-map"
                    style={{ height: '100%', borderRadius: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {markers.map((place, idx) => {
                      const customIcon = L.divIcon({
                        className: '',
                        html: `
                          <div class="map-marker-pin">
                            <div class="map-marker-img-wrap">
                              ${place.image_url
                                ? `<img src="${place.image_url}" class="map-marker-img" alt="${place.name}" />`
                                : `<div class="map-marker-fallback"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-40-40-104 104z"></path></svg></div>`
                              }
                            </div>
                            <div class="map-marker-tail"></div>
                          </div>`,
                        iconSize: [52, 62],
                        iconAnchor: [26, 62],
                        popupAnchor: [0, -66],
                      });
                      return (
                        <Marker key={idx} position={[parseFloat(place.latitude), parseFloat(place.longitude)]} icon={customIcon}>
                          <Popup>
                            <div class="map-popup">
                              {place.image_url && <img src={place.image_url} alt={place.name} class="map-popup-img" />}
                              <strong>{place.name}</strong>
                              {place.category && <span class="map-popup-cat">{place.category}</span>}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                    {/* GraphHopper road route — falls back to straight-line dashes if unavailable */}
                    {ghRoute ? (
                      <Polyline positions={ghRoute.points} color="#667eea" weight={4} opacity={0.85} />
                    ) : (
                      polyline.length > 1 && <Polyline positions={polyline} color="#667eea" dashArray="5, 10" />
                    )}
                  </MapContainer>
                </div>

                  {/* ADD PLACE LOGIC MOVED HERE FOR SIDE-BY-SIDE */}
                  <div className="itinerary-places" style={{ flex: 1, marginTop: 0, background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-head)' }}>Places in this Plan</h3>
                      {!showAddPlaceDropdown && (
                        <button 
                          onClick={() => setShowAddPlaceDropdown(true)} 
                          style={{ 
                            padding: '8px 20px', 
                            borderRadius: '12px', 
                            background: 'var(--secondary)', 
                            color: 'white', 
                            border: 'none', 
                            fontSize: '0.9rem', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          <FaPlus style={{ fontSize: '0.8rem' }} /> Add Place
                        </button>
                      )}
                    </div>

                    {/* JOURNEY SUMMARY - MOVED HERE FOR COMPACT UI */}
                    {(ghRoute || ghLoading || ghError) && (
                      <div className="journey-summary" style={{ marginBottom: '24px', background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
                        {ghLoading && (
                          <div className="journey-summary__loading" style={{ padding: '15px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                            <span className="journey-spinner" /> Calculating route…
                          </div>
                        )}
                        {ghError && !ghLoading && (
                          <p className="journey-summary__error" style={{ fontSize: '0.85rem' }}><FaExclamationTriangle /> {ghError}</p>
                        )}
                        {ghRoute && !ghLoading && (
                          <div className="journey-summary__stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div className="journey-stat" style={{ padding: '12px', borderRadius: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                              <span className="journey-stat__icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}><FaRoute /></span>
                              <div>
                                <span className="journey-stat__label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Distance</span>
                                <span className="journey-stat__value" style={{ fontSize: '0.9rem', fontWeight: '800', display: 'block' }}>{ghRoute.distanceKm} km</span>
                              </div>
                            </div>
                            <div className="journey-stat" style={{ padding: '12px', borderRadius: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                              <span className="journey-stat__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}><FaClock /></span>
                              <div>
                                <span className="journey-stat__label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Time</span>
                                <span className="journey-stat__value" style={{ fontSize: '0.9rem', fontWeight: '800', display: 'block' }}>
                                  {ghRoute.durationMin >= 60
                                    ? `${Math.floor(ghRoute.durationMin / 60)}h ${ghRoute.durationMin % 60}m`
                                    : `${ghRoute.durationMin}m`}
                                </span>
                              </div>
                            </div>
                            <div className="journey-stat" style={{ padding: '12px', borderRadius: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                              <span className="journey-stat__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}><FaMoneyBillWave /></span>
                              <div>
                                <span className="journey-stat__label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Cost</span>
                                <span className="journey-stat__value" style={{ fontSize: '0.9rem', fontWeight: '800', display: 'block' }}>
                                  LKR {(ghRoute.distanceKm * PRICE_PER_KM).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {showAddPlaceDropdown && !isLinkingPlace && (
                      <div className="add-place-section">
                        <div className="add-place-header">
                          <h3>Add a Place</h3>
                          <button onClick={() => { setShowAddPlaceDropdown(false); setSearchPlaceTerm(''); }} className="add-place-close"><FaTimes /></button>
                        </div>
                        <div className="place-search-wrapper">
                          <span className="place-search-icon"><FaSearch /></span>
                          <input
                            type="text"
                            placeholder="Search by name or category…"
                            value={searchPlaceTerm}
                            onChange={(e) => setSearchPlaceTerm(e.target.value)}
                            className="place-search-input"
                            autoFocus
                          />
                          {searchPlaceTerm && (
                            <button className="place-search-clear" onClick={() => setSearchPlaceTerm('')}>✕</button>
                          )}
                        </div>

                        {/* Category Chips Bar */}
                        <div className="search-category-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                          {searchCategories.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedSearchCategory(selectedSearchCategory === cat.id ? null : cat.id)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '12px',
                                background: selectedSearchCategory === cat.id ? 'var(--primary)' : 'var(--bg-page)',
                                color: selectedSearchCategory === cat.id ? 'white' : 'var(--text-body)',
                                border: '1px solid var(--border)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                              }}
                            >
                              <span>{cat.icon}</span> {cat.id}
                            </button>
                          ))}
                        </div>

                        {showSearchResults ? (
                          <div className="place-suggestions">
                            {filteredPlaces.length === 0 ? (
                              <div className="place-suggestions__empty">No places match your search criteria.</div>
                            ) : (
                              filteredPlaces.map(p => (
                                <button
                                  key={p.id}
                                  className="place-suggestion-card"
                                  onClick={() => {
                                    handleAddPlaceToItinerary(selectedItinerary.id, p.id);
                                    setSearchPlaceTerm('');
                                    setSelectedSearchCategory(null);
                                  }}
                                  style={{
                                    animation: 'modalPop 0.3s ease-out'
                                  }}
                                >
                                  <div className="place-suggestion-img-wrap">
                                    {p.image_url
                                      ? <img src={p.image_url} alt={p.name} className="place-suggestion-img" />
                                      : <div className="place-suggestion-img-placeholder">🏞️</div>
                                    }
                                  </div>
                                  <div className="place-suggestion-info">
                                    <span className="place-suggestion-name" style={{ fontWeight: '700', fontSize: '1rem' }}>{p.name}</span>
                                    {p.category && <span className="place-suggestion-cat" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', marginTop: '4px', display: 'inline-block' }}>{p.category}</span>}
                                  </div>
                                  <span className="place-suggestion-add" style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>+</span>
                                </button>
                              ))
                            )}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Type something or select a category to find places...</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="places-list" style={{ flex: 1, overflowY: 'auto' }}>
                      {selectedItinerary.places?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                          <p>No places added yet.</p>
                          <p style={{ fontSize: '0.85rem' }}>Start by adding a destination below!</p>
                        </div>
                      ) : (
                        selectedItinerary.places?.map((item, index) => (
                          <div key={item.id || index} className="place-item" style={{ 
                            background: 'var(--bg-page)', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            border: '1px solid var(--border)',
                            transition: 'all 0.2s'
                          }}>
                            <div className="place-order" style={{ 
                              width: '32px', 
                              height: '32px', 
                              background: 'var(--primary)', 
                              color: 'white', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                              fontWeight: '700',
                              flexShrink: 0
                            }}>{index + 1}</div>
                            <div className="place-details" style={{ flex: 1 }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{item.name}</h4>
                              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.category || 'Point of Interest'}</p>
                            </div>
                            <button 
                              onClick={() => handleRemovePlace(selectedItinerary.id, item.place_id)} 
                              className="btn-remove"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: 'none',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                            >
                              <FaTimes style={{ fontSize: '0.8rem' }} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    


                    <div className="itinerary-actions" style={{ marginTop: '12px' }}>
                      <button 
                        onClick={handleRequestGuides} 
                        className="btn btn-success confirm-btn" 
                        style={{ width: '100%', borderRadius: '12px', padding: '12px', fontWeight: '700' }}
                        disabled={loading || loadingGuides || !selectedItinerary.places?.length}
                      >
                        {loadingGuides
                          ? <><FaSearch /> Finding Guides...</>
                          : noGuidesFound
                            ? 'Browse All Guides'
                            : <><FaBullseye /> Find Suitable Guides</>
                        }
                      </button>
                    </div>
                  </div>
                </div>



                {/* GUIDE SUGGESTIONS */}
                {showGuideSuggestions && (
                  <div className="guide-suggestions" ref={guideSuggestionsRef}>
                    <div className="guide-suggestions-header">
                      <h3><FaBullseye /> Recommended Travel Guides</h3>
                      <button 
                        onClick={() => {
                          setShowGuideSuggestions(false);
                          setNoGuidesFound(false);
                        }} 
                        className="btn btn-sm"
                      >
                        <FaTimes /> Close
                      </button>
                    </div>
                    
                    {suggestedGuides.length === 0 ? (
                      <div className="no-guides-found">
                        <p>No guides found for your selected destinations.</p>
                        <p>Try adding more places, or browse all available guides manually.</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate('/travel-guides')}
                        >
                          Browse Travel Guides
                        </button>
                      </div>
                    ) : (
                      <div className="guides-grid">
                        {suggestedGuides.map((guide) => (
                          <div key={guide.user_id} className="guide-card">
                            <div className="guide-card-header">
                              {guide.profile_image_url && (
                                <img 
                                  src={guide.profile_image_url} 
                                  alt={guide.full_name} 
                                  className="guide-avatar"
                                />
                              )}
                              <div className="guide-info">
                                <h4>{guide.full_name}</h4>
                                <div className="guide-specialization">
                                  {guide.specialization && <span className="badge">{guide.specialization}</span>}
                                  <span className="experience">{guide.experience_years} years experience</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="guide-details">
                              {guide.bio && <p className="guide-bio">{guide.bio}</p>}
                              
                              <div className="guide-stats">
                                <div className="stat">
                                  <span className="stat-label">Languages:</span>
                                  <span className="stat-value">{guide.languages || 'Not specified'}</span>
                                </div>
                                <div className="stat">
                                  <span className="stat-label">Rate:</span>
                                  <span className="stat-value">LKR {guide.hourly_rate}/hour</span>
                                </div>
                              </div>
                              
                              {guide.matched_places && guide.matched_places.length > 0 && (
                                <div className="matched-places">
                                  <span className="match-label">Covers your places:</span>
                                  <div className="matched-places-list">
                                    {guide.matched_places.map((place, idx) => (
                                      <span key={idx} className="matched-place">{place}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="guide-contact">
                                {guide.contact_number && (
                                  <a href={`tel:${guide.contact_number}`} className="btn btn-outline">
                                    <FaPhone /> Call {guide.contact_number}
                                  </a>
                                )}
                                <button 
                                  onClick={() => handleBookGuide(guide.user_id)}
                                  className="btn btn-primary"
                                  disabled={loading}
                                >
                                  {loading ? 'Booking...' : <><FaCalendarAlt /> Book This Guide</>}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {user?.role === 'tourist' && currentItineraryBookings.length > 0 && (
                  <div className="booking-request-summary">
                    <div className="booking-summary-header">
                      <div>
                        <h3>My guide requests</h3>
                        <p>Track the status of requests created for this itinerary.</p>
                      </div>
                    </div>
                    <div className="booking-cards">
                      {currentItineraryBookings.map((booking) => (
                        <div key={booking.id} className="booking-card">
                          <div className="booking-card-top">
                            <div>
                              <p className="booking-card-title">{booking.guide_name || 'Guide Request'}</p>
                              <p className="booking-card-meta">{booking.itinerary_title}</p>
                            </div>
                            <span className={`status-pill status-${booking.status}`}>
                              {booking.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="booking-card-body">
                            {booking.quoted_price && (
                              <p className="booking-card-price"><strong>Quoted price:</strong> {booking.currency || 'LKR'} {booking.quoted_price}</p>
                            )}
                            {booking.notes && <p className="booking-card-note"><strong>Note:</strong> {booking.notes}</p>}
                            {booking.status === 'pending' && <p className="booking-card-info">Waiting for the guide to reply.</p>}
                            {booking.status === 'quoted' && <p className="booking-card-info">The guide sent a quote. Open Travel Guides to view or accept it.</p>}
                            {booking.status === 'accepted' && (
                              <p className="booking-success">Booking confirmed! Contact the guide at <strong>{booking.guide_contact}</strong>.</p>
                            )}
                            {booking.status === 'rejected' && (
                              <p className="booking-error">This request was declined. Try another guide or place.</p>
                            )}
                            {booking.status === 'cancelled' && (
                              <>
                                <p className="booking-error">This request was cancelled by you.</p>
                                <div className="booking-card-actions">
                                  <button 
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteBooking(booking.id)}
                                  >
                                    Delete Request
                                  </button>
                                </div>
                              </>
                            )}
                            {(booking.status === 'pending' || booking.status === 'quoted') && (
                              <div className="booking-card-actions">
                                <button 
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel Request
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm booking-expand-btn"
                              onClick={() => setExpandedBookingId(prev => (prev === booking.id ? null : booking.id))}
                            >
                              {expandedBookingId === booking.id ? 'Hide Messages' : 'Message / Conversation'}
                            </button>
                            {expandedBookingId === booking.id && (
                               <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                 <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-head)', fontWeight: '800' }}>Messenger Channel</h4>
                                 
                                 {bookingMessagesByBooking[booking.id]?.length > 0 && (
                                   <div style={{ marginBottom: '15px' }}>
                                     <div style={{ 
                                       maxHeight: '200px', 
                                       overflowY: 'auto', 
                                       display: 'flex', 
                                       flexDirection: 'column', 
                                       gap: '10px', 
                                       paddingRight: '8px',
                                       paddingBottom: '5px'
                                     }}>
                                       {bookingMessagesByBooking[booking.id].map(m => (
                                         <div key={m.id} style={{ 
                                           padding: '10px 12px', 
                                           backgroundColor: m.author_email === user.email ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-card)', 
                                           borderRadius: '12px', 
                                           border: '1px solid var(--border)',
                                           alignSelf: m.author_email === user.email ? 'flex-end' : 'flex-start',
                                           maxWidth: '85%',
                                           boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                         }}>
                                           <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                             <strong style={{ color: m.author_email === user.email ? 'var(--primary)' : 'var(--text-muted)' }}>
                                               {m.author_email === user.email ? 'ME' : 'GUIDE'}
                                             </strong>
                                             <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                           </div>
                                           <div style={{ color: 'var(--text-body)', fontSize: '0.85rem', lineHeight: '1.4' }}>{m.message}</div>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                   <input
                                     type="text"
                                     value={messageTextByBooking[booking.id] || ''}
                                     onChange={(e) => setMessageTextByBooking(prev => ({
                                       ...prev,
                                       [booking.id]: e.target.value
                                     }))}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter') {
                                         e.preventDefault();
                                         handleSendBookingMessage(booking.id);
                                       }
                                     }}
                                     placeholder="Write to your guide..."
                                     style={{ 
                                       flex: 1,
                                       padding: '10px 14px', 
                                       borderRadius: '12px', 
                                       border: '1px solid var(--border)', 
                                       backgroundColor: 'var(--bg-page)',
                                       color: 'var(--text-body)',
                                       outline: 'none',
                                       fontSize: '0.9rem'
                                     }}
                                   />
                                   <button
                                     type="button"
                                     className="btn btn-primary"
                                     style={{ 
                                       height: '40px', 
                                       width: '40px', 
                                       borderRadius: '50%', 
                                       display: 'flex', 
                                       alignItems: 'center', 
                                       justifyContent: 'center',
                                       padding: 0,
                                       boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                     }}
                                     onClick={() => handleSendBookingMessage(booking.id)}
                                   >
                                     <FaPaperPlane style={{ fontSize: '0.9rem' }} />
                                   </button>
                                 </div>
                               </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}



                {pendingPlaceToAddId && itineraries.length > 1 && (
                  <div className="add-linked-place-panel">
                    <h3>Add place to a specific itinerary</h3>
                    <p>Select the plan where you want to add this place:</p>
                    <select
                      value={targetItineraryId || ''}
                      onChange={(e) => {
                        setTargetItineraryId(parseInt(e.target.value));
                        const chosen = itineraries.find(it => it.id === parseInt(e.target.value));
                        if (chosen) setSelectedItinerary(chosen);
                      }}
                      className="form-control"
                    >
                      {itineraries.map(it => (
                        <option key={it.id} value={it.id}>{it.title || `Plan ${it.id}`}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAddPlaceToItinerary(targetItineraryId, pendingPlaceToAddId, true)}
                      disabled={!targetItineraryId}
                    >
                      Add selected place to this itinerary
                    </button>
                    {placeAddError && <p className="error">{placeAddError}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-itinerary">
                <h3>No Itinerary Selected</h3>
              </div>
            )}
          </section>
        </div>
      </div>
      {/* Create Itinerary Modal */}
      {showCreateModal && (
        <div className="review-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="review-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
              <FaTimes />
            </button>
            <div className="create-itinerary-modal">
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-head)', marginBottom: '32px', letterSpacing: '-0.02em' }}>Create New Itinerary</h3>
              <form onSubmit={handleCreateItinerary} className="review-form">
                <div className="form-group">
                  <label>Itinerary Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Vacation, Weekend Getaway" 
                    value={newItinerary.title} 
                    onChange={(e) => setNewItinerary({...newItinerary, title: e.target.value})} 
                    required 
                  />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      min={today} 
                      value={newItinerary.startDate} 
                      onChange={(e) => setNewItinerary({...newItinerary, startDate: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>End Date</label>
                    <input 
                      type="date" 
                      min={newItinerary.startDate || today} 
                      value={newItinerary.endDate} 
                      onChange={(e) => setNewItinerary({...newItinerary, endDate: e.target.value})} 
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '20px', borderRadius: '12px' }}>
                  <FaPlus /> Create Itinerary
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ItineraryPage;