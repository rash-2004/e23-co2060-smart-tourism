import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './PlaceCard.css';

const PlaceCard = ({ place, onViewDetails, onAddToItinerary }) => {
  const [imageUrl, setImageUrl] = useState(place.image_url);

  useEffect(() => {
    // Automatically fetch a real image from Wikipedia if missing or if it's the hardcoded Unsplash placeholder
    if (!place.image_url || place.image_url.includes('unsplash.com')) {
      const fetchWikiImage = async () => {
        try {
          const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(place.name)}&prop=pageimages&format=json&pithumbsize=800&origin=*`);
          const data = await res.json();
          const pages = data.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId !== "-1" && pages[pageId].thumbnail) {
            setImageUrl(pages[pageId].thumbnail.source);
          } else {
            // Last resort fallback
            setImageUrl('https://via.placeholder.com/800x600?text=Image+Not+Found');
          }
        } catch (err) {
          console.error('Wiki fetch error:', err);
        }
      };
      fetchWikiImage();
    } else {
      setImageUrl(place.image_url);
    }
  }, [place.name, place.image_url]);

  return (
    <motion.div 
      className="place-card"
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {imageUrl && (
        <div className="place-image">
          <img src={imageUrl} alt={place.name} />
        </div>
      )}
      <div className="place-content">
        <h3>{place.name}</h3>
        {place.category && <span className="category-tag">{place.category}</span>}
        
        <p className="description">{place.description?.substring(0, 100)}...</p>
        
        {place.latitude && place.longitude && (
          <p className="location">
            <FaMapMarkerAlt /> {parseFloat(place.latitude).toFixed(4)}, {parseFloat(place.longitude).toFixed(4)}
          </p>
        )}
        
        {place.review_count > 0 ? (
          <p className="rating" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b', fontWeight: 'bold' }}>
            <FaStar /> {parseFloat(place.average_rating).toFixed(1)} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>({place.review_count} reviews)</span>
          </p>
        ) : (
          <p className="rating" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
             No reviews yet
          </p>
        )}
        
        <div className="card-actions">
          {onViewDetails && (
            <button 
              className="btn btn-primary" 
              onClick={() => onViewDetails(place.id, imageUrl)}
            >
              View Details
            </button>
          )}
          {onAddToItinerary && (
            <button 
              className="btn btn-success" 
              onClick={() => onAddToItinerary(place.id)}
            >
              Add to Trip
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlaceCard;
