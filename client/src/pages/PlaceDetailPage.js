import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlace } from '../context/PlaceContext';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';
import { reviewService } from '../services';
import './PlaceDetailPage.css';

const PlaceDetailPage = () => {
  const { id } = useParams();
  const { getPlaceById, loading: placesLoading } = usePlace();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const foundPlace = getPlaceById(id);
    if (foundPlace) {
      setPlace(foundPlace);
      fetchReviews();
    }
  }, [id, getPlaceById]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewService.getPlaceReviews(id);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (formData) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const response = await reviewService.createReview(id, {
        ...formData,
        tourist_id: user?.id
      });
      setReviews([...reviews, response.data.review]);
      return { success: true };
    } catch (error) {
      console.error('Failed to submit review:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to submit review' 
      };
    }
  };

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

        <div className="place-detail-header">
          {place.image_url && (
            <div className="place-hero-image">
              <img src={place.image_url} alt={place.name} />
            </div>
          )}
        </div>

        <div className="place-detail-content">
          <div className="place-info">
            <h1>{place.name}</h1>
            
            {place.category && (
              <span className="category-badge">{place.category}</span>
            )}

            {place.rating && (
              <p className="rating-display">⭐ Rating: {parseFloat(place.rating).toFixed(1)}/5</p>
            )}

            <div className="place-meta">
              {place.latitude && place.longitude && (
                <p>
                  📍 <strong>Location:</strong> {parseFloat(place.latitude).toFixed(4)}, {parseFloat(place.longitude).toFixed(4)}
                </p>
              )}
            </div>

            <div className="place-description">
              <h2>About this Place</h2>
              <p>{place.description}</p>
            </div>

            <button 
              onClick={() => navigate('/itinerary?add=' + place.id)}
              className="btn btn-success btn-large"
            >
              Add to My Itinerary
            </button>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section">
            <h2>Visitor Reviews</h2>

            {isAuthenticated() && (
              <ReviewForm onSubmit={handleReviewSubmit} />
            )}

            {!isAuthenticated() && (
              <div className="login-prompt">
                <p>Please login to leave a review</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">
                  Login
                </button>
              </div>
            )}

            <div className="reviews-list">
              {reviewsLoading ? (
                <p className="loading">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <strong>{review.title}</strong>
                      <span className="review-rating">⭐ {review.rating}/5</span>
                    </div>
                    <p className="review-text">{review.comment}</p>
                    <small className="review-meta">
                      By {review.user_email} on {new Date(review.created_at).toLocaleDateString()}
                    </small>
                  </div>
                ))
              ) : (
                <p className="no-reviews">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PlaceDetailPage;
