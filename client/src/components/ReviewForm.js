import React, { useState } from 'react';
import './ReviewForm.css';

const ReviewForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    title: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSubmit(formData);
    if (result?.success) {
      setSubmitted(true);
      setFormData({ rating: 5, comment: '', title: '' });
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="review-form-container">
      <h3>Share Your Experience</h3>
      
      {submitted && <div className="success">Review submitted successfully!</div>}
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label htmlFor="title">Review Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Amazing experience!"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="rating">Rating</label>
          <select 
            id="rating" 
            name="rating" 
            value={formData.rating}
            onChange={handleChange}
          >
            <option value="1">1 - Poor</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very Good</option>
            <option value="5">5 - Excellent</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Review</label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Share your thoughts about this place..."
            rows="5"
            maxLength="1000"
            required
          />
          <small>{formData.comment.length}/1000</small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
