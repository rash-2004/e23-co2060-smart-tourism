import React, { createContext, useContext, useState, useCallback } from 'react';
import API from '../services/api';

const PlaceContext = createContext();

export const PlaceProvider = ({ children }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minRating: 0
  });

  // Fetch all places
  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/api/places');
      setPlaces(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch places');
      console.error('Fetch places error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search places with algorithm
  const searchPlaces = useCallback((query) => {
    if (!query.trim()) {
      return places;
    }

    const lowerQuery = query.toLowerCase();
    
    return places.filter(place => 
      place.name.toLowerCase().includes(lowerQuery) ||
      place.description.toLowerCase().includes(lowerQuery) ||
      (place.category && place.category.toLowerCase().includes(lowerQuery))
    );
  }, [places]);

  // Filter places by location (distance-based search)
  const filterPlacesByLocation = useCallback((latitude, longitude, distanceKm = 10) => {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const earthRadiusKm = 6371;

    return places.filter(place => {
      const lat1 = toRadians(latitude);
      const lat2 = toRadians(place.latitude);
      const deltaLat = toRadians(place.latitude - latitude);
      const deltaLon = toRadians(place.longitude - longitude);

      const a = 
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadiusKm * c;

      return distance <= distanceKm;
    });
  }, [places]);

  // Get place by ID
  const getPlaceById = useCallback((id) => {
    return places.find(place => place.id === parseInt(id));
  }, [places]);

  // Add new place (admin only)
  const addPlace = async (placeData) => {
    try {
      setLoading(true);
      const response = await API.post('/api/places', placeData);
      setPlaces([...places, response.data.place]);
      return { success: true, place: response.data.place };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add place';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Delete place
  const deletePlace = async (id) => {
    try {
      setLoading(true);
      await API.delete(`/api/places/${id}`);
      setPlaces(places.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete place';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    places,
    loading,
    error,
    filters,
    setFilters,
    fetchPlaces,
    searchPlaces,
    filterPlacesByLocation,
    getPlaceById,
    addPlace,
    deletePlace
  };

  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>;
};

export const usePlace = () => {
  const context = useContext(PlaceContext);
  if (!context) {
    throw new Error('usePlace must be used within PlaceProvider');
  }
  return context;
};
