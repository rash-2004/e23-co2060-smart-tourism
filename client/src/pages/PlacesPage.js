import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlace } from '../context/PlaceContext';
import PlaceCard from '../components/PlaceCard';
import SearchBar from '../components/SearchBar';
import './PlacesPage.css';

const PlacesPage = () => {
  const { places, loading, error, fetchPlaces, searchPlaces } = usePlace();
  const [displayedPlaces, setDisplayedPlaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    setDisplayedPlaces(places);
  }, [places]);

  const handleSearch = (query) => {
    if (query.trim()) {
      const filtered = searchPlaces(query);
      setDisplayedPlaces(filtered);
    } else {
      setDisplayedPlaces(places);
    }
  };

  const handleViewDetails = (placeId, imageUrl) => {
    navigate(`/place/${placeId}`, { state: { passedImageUrl: imageUrl } });
  };

  const handleAddToItinerary = (placeId) => {
    navigate(`/itinerary?add=${placeId}`);
  };

  return (
    <main className="places-page">
      <div className="container">
        <div className="page-header">
          <h1>Explore Travel Destinations</h1>
          <p>Discover amazing places around the world</p>
        </div>

        <SearchBar onSearch={handleSearch} placeholder="Search places by name or description..." />

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading places...</div>
        ) : displayedPlaces.length > 0 ? (
          <div>
            <p className="results-count">Found {displayedPlaces.length} place(s)</p>
            <div className="grid grid-cols-3">
              {displayedPlaces.map(place => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onViewDetails={handleViewDetails}
                  onAddToItinerary={handleAddToItinerary}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No places found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default PlacesPage;
