import React, { useState, useEffect } from 'react';
import { reviewService } from '../services';
import './ReviewSection.css';
import { FaStar } from 'react-icons/fa';

const ReviewSection = ({ targetId, type }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);

    // Form state
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
                setUserId(user.id);
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
            }
        }
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetId, type]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            let res;
            if (type === 'place') {
                res = await reviewService.getPlaceReviews(targetId);
            } else if (type === 'guide') {
                res = await reviewService.getGuideReviews(targetId);
            }
            if (res && res.data && res.data.success) {
                setReviews(res.data.reviews || []);
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating.');
            return;
        }
        if (type === 'place' && !title.trim()) {
            setError('Please provide a review title.');
            return;
        }

        const wordCount = comment.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount > 100) {
            setError('Your comment exceeds the 100-word limit.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            const data = {
                tourist_id: userId,
                rating,
                comment
            };
            if (type === 'place') {
                data.title = title;
            }

            if (type === 'place') {
                await reviewService.createReview(targetId, data);
            } else {
                await reviewService.createGuideReview(targetId, data);
            }

            // Reset form and refetch
            setRating(0);
            setHover(0);
            setTitle('');
            setComment('');
            fetchReviews();
        } catch (err) {
            console.error('Failed to submit review:', err);
            setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    return (
        <div className="review-section">
            <div className="review-header">
                <h3>Reviews & Ratings</h3>
                <div className="review-aggregate">
                    <div className="aggregate-score">
                        <FaStar className="star-icon golden" />
                        <span>{averageRating}</span>
                    </div>
                    <span className="aggregate-count">({reviews.length} reviews)</span>
                </div>
            </div>

            {userRole === 'tourist' && (
                <div className="review-form-card">
                    <h4>Leave a Review</h4>
                    {error && <div className="review-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="star-rating-input">
                            {[...Array(5)].map((star, index) => {
                                index += 1;
                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        className={index <= (hover || rating) ? "star-btn active" : "star-btn"}
                                        onClick={() => setRating(index)}
                                        onMouseEnter={() => setHover(index)}
                                        onMouseLeave={() => setHover(rating)}
                                    >
                                        <FaStar />
                                    </button>
                                );
                            })}
                        </div>
                        
                        {type === 'place' && (
                            <input 
                                type="text" 
                                placeholder="Review Title" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="review-input"
                            />
                        )}
                        
                        <textarea 
                            placeholder="Share your experience..." 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="review-textarea"
                            rows="3"
                        />
                        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: comment.trim().split(/\s+/).filter(w => w.length > 0).length > 100 ? '#ff4d4f' : 'gray', marginTop: '-10px', marginBottom: '15px' }}>
                            {comment.trim().split(/\s+/).filter(w => w.length > 0).length} / 100 words
                        </div>
                        <button type="submit" className="btn btn-primary review-submit-btn" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Post Review'}
                        </button>
                    </form>
                </div>
            )}

            <div className="reviews-list">
                {loading ? (
                    <div className="review-loading">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="review-empty">No reviews yet. Be the first to leave one!</div>
                ) : (
                    reviews.map((rev) => (
                        <div key={rev.id} className="review-item">
                            <div className="review-item-header">
                                <div className="reviewer-info">
                                    <div className="reviewer-avatar">
                                        {rev.tourist_name ? rev.tourist_name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <strong>{rev.tourist_name || 'Anonymous User'}</strong>
                                        <div className="review-date">
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="review-stars-display" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div>
                                        {[...Array(5)].map((star, i) => (
                                            <FaStar key={i} className={i < rev.rating ? "star-icon golden" : "star-icon gray"} />
                                        ))}
                                    </div>
                                    {parseInt(userId) === rev.tourist_id && (
                                        <button 
                                            className="btn btn-sm" 
                                            style={{ backgroundColor: 'transparent', color: '#ff4d4f', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                            onClick={async () => {
                                                if (window.confirm("Are you sure you want to delete this review?")) {
                                                    try {
                                                        if (type === 'place') {
                                                            await reviewService.deletePlaceReview(targetId, rev.id);
                                                        } else {
                                                            await reviewService.deleteGuideReview(targetId, rev.id);
                                                        }
                                                        fetchReviews();
                                                    } catch (error) {
                                                        console.error("Failed to delete review", error);
                                                        alert("Failed to delete review.");
                                                    }
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            {rev.title && <h5 className="review-title">{rev.title}</h5>}
                            {rev.comment && <p className="review-comment">{rev.comment}</p>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
