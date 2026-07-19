import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePlace } from '../context/PlaceContext';
import { useAuth } from '../context/AuthContext';
import ReviewSection from '../components/ReviewSection';
import { FaMapMarkerAlt, FaPlus, FaStar, FaTimes, FaUser, FaCommentDots } from 'react-icons/fa';
import './PlaceDetailPage.css';

const PlaceDetailPage = () => {
  const { id } = useParams();
  const { getPlaceById, loading: placesLoading } = usePlace();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(location.state?.passedImageUrl || null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (place) {
      // If we didn't get a passed image from navigation state, fetch one
      if (!imageUrl) {
        if (!place.image_url || place.image_url.includes('unsplash.com')) {
          const fetchWikiImage = async () => {
            try {
              // Increased pithumbsize to 2000 for high-resolution hero impact
              const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(place.name)}&prop=pageimages&format=json&pithumbsize=2000&origin=*`);
              const data = await res.json();
              const pages = data.query.pages;
              const pageId = Object.keys(pages)[0];
              if (pageId !== "-1" && pages[pageId].thumbnail) {
                setImageUrl(pages[pageId].thumbnail.source);
              } else {
                setImageUrl('https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80');
              }
            } catch (err) {
              console.error('Wiki fetch error:', err);
            }
          };
          fetchWikiImage();
        } else {
          setImageUrl(place.image_url);
        }
      }
    }
  }, [place, imageUrl]);



  useEffect(() => {
    const foundPlace = getPlaceById(id);
    if (foundPlace) {
      setPlace(foundPlace);
    }
  }, [id, getPlaceById]);



  if (placesLoading) {
    return <main className="loading">Loading place details...</main>;
  }

  if (!place) {
    return (
      <main className="place-detail-page">
        <div className="container">
          <div className="error">Place not found</div>
          <button onClick={() => navigate('/places')} className="btn btn-primary">
            Back to Places
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="place-detail-page">
      <div className="container">
        <button onClick={() => navigate('/places')} className="btn-back">
          ← Back to Places
        </button>

        <div className="place-detail-main">
          {imageUrl && (
            <div className="place-side-image">
              <img src={imageUrl} alt={place.name} />
            </div>
          )}

          <div className="place-info">
            <h1>{place.name}</h1>
            
            <div className="place-badges">
              {place.category && (
                <span className="category-badge">{place.category}</span>
              )}
              {place.rating && (
                <span className="rating-badge">⭐ {parseFloat(place.rating).toFixed(1)}</span>
              )}
              <button 
                onClick={() => navigate('/itinerary?add=' + place.id)}
                className="itinerary-badge"
              >
                <FaPlus /> Add to Itinerary
              </button>
              <button 
                onClick={() => isAuthenticated() ? setShowReviewModal(true) : navigate('/login')}
                className="review-badge-btn"
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <FaStar /> Add Review
              </button>
            </div>

            <div className="place-meta">
              {place.latitude && place.longitude && (
                <p className="location-text">
                  <FaMapMarkerAlt /> <strong>Location:</strong> {parseFloat(place.latitude).toFixed(4)}, {parseFloat(place.longitude).toFixed(4)}
                </p>
              )}
            </div>

            <div className="place-description">
              <h2>About this Place</h2>
              <p>{place.description}</p>
            </div>
          </div>
        </div>

        <div className="place-detail-content">
          <ReviewSection targetId={id} type="place" />
        </div>
      </div>

    </main>
  );
};

export default PlaceDetailPage;
