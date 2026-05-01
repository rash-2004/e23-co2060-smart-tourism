import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { guideService, bookingService } from '../services';
import './TravelGuidePage.css';
import SearchBar from '../components/SearchBar';

const TravelGuidePage = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetchGuides();
    if (user?.role === 'tourist') {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await bookingService.getTouristBookings(user.id);
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      setError('');
      setSuccess('');
      if (action === 'accept') {
        await bookingService.acceptQuote(bookingId);
        setSuccess('Quote accepted successfully. The tourist will be notified.');
      } else {
        await bookingService.rejectQuote(bookingId);
        setSuccess('Quote rejected. The tourist will be notified.');
      }
      fetchBookings();
    } catch (err) {
      setError(`Failed to ${action} quote`);
    }
  };

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await guideService.getAllGuides();
      // Ensure we extract guides array from response.data
      const guideList = response.data.guides || [];
      setGuides(guideList);
      setFilteredGuides(guideList);
    } catch (err) {
      setError('Failed to load travel guides');
      console.error('Error fetching guides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      const filtered = guides.filter(guide =>
        (guide.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (guide.specialization || '').toLowerCase().includes(query.toLowerCase()) ||
        (guide.bio || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredGuides(filtered);
    } else {
      setFilteredGuides(guides);
    }
  };

  const handleContactGuide = (guide) => {
    setSelectedGuide(guide);
    setShowContact(true);
  };

  const handleViewPortfolio = (guide) => {
    setSelectedGuide(guide);
    setShowPortfolio(true);
  };

  const closeModals = () => {
    setShowPortfolio(false);
    setShowContact(false);
    setSelectedGuide(null);
  };

  return (
    <main className="travel-guide-page">
      <div className="container">
        <div className="page-header">
          <h1>Meet Our Travel Guides</h1>
          <p>Connect with experienced local guides to enhance your journey</p>
        </div>

        <SearchBar onSearch={handleSearch} placeholder="Search guides by name or specialization..." />

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {user?.role === 'tourist' && bookings.length > 0 && (
          <section className="my-bookings-section" style={{ 
            marginBottom: '40px', 
            padding: '20px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '12px',
            border: '1px solid #eee'
          }}>
            <h2 style={{ marginBottom: '20px' }}>📋 My Guide Requests</h2>
            <div className="bookings-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {bookings.map(booking => (
                <div key={booking.id} className="booking-card" style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  borderLeft: `5px solid ${
                    booking.status === 'accepted' ? '#2ecc71' : 
                    booking.status === 'quoted' ? '#3498db' : '#f1c40f'
                  }`
                }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{booking.guide_name}</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>{booking.itinerary_title}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`status-badge status-${booking.status}`} style={{ fontSize: '0.75rem' }}>
                      {booking.status.toUpperCase()}
                    </span>
                    {booking.quoted_price && (
                      <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{booking.quoted_price}</span>
                    )}
                  </div>

                  {booking.status === 'accepted' && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <p style={{ margin: '0 0 5px 0' }}><strong>Guide Contact:</strong> <a href={`tel:${booking.guide_contact}`} style={{ color: '#2e7d32', fontWeight: 'bold' }}>{booking.guide_contact}</a></p>
                      <p style={{ margin: 0 }}><strong>Email:</strong> {booking.guide_email}</p>
                    </div>
                  )}

                  {booking.status === 'quoted' && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn btn-success" 
                        style={{ flex: 1, padding: '5px', fontSize: '0.8rem' }}
                        onClick={() => handleBookingAction(booking.id, 'accept')}
                      >
                        Accept Price
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ flex: 1, padding: '5px', fontSize: '0.8rem' }}
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="loading">Loading travel guides...</div>
        ) : filteredGuides.length > 0 ? (
          <div>
            <p className="results-count">Found {filteredGuides.length} guide(s)</p>
            <div className="guides-grid">
              {filteredGuides.map(guide => (
                <div key={guide.id} className="guide-card">
                  <div className="guide-image">
                    <img 
                      src={guide.profile_image_url || 'https://via.placeholder.com/150?text=Guide'} 
                      alt={guide.full_name} 
                    />
                  </div>
                  <div className="guide-content">
                    <h3>{guide.full_name}</h3>
                    <div className="guide-location-badge">
                      📍 {guide.covered_locations || 'Island Wide'}
                    </div>
                    <p className="specialization">{guide.specialization || 'Local Guide'}</p>
                    <p className="bio">{(guide.bio || 'No bio available').substring(0, 150)}...</p>
                    
                    <div className="guide-stats">
                      {guide.experience_years > 0 && (
                        <span>✓ {guide.experience_years} years experience</span>
                      )}
                      {guide.rating && (
                        <span>⭐ {guide.rating}/5</span>
                      )}
                      {guide.hourly_rate > 0 && (
                        <span className="price">${guide.hourly_rate}/hr</span>
                      )}
                    </div>

                    <div className="guide-languages">
                      <strong>Languages:</strong> {guide.languages || 'English'}
                    </div>

                    <div className="guide-actions">
                      <button 
                        onClick={() => handleViewPortfolio(guide)}
                        className="btn btn-primary"
                      >
                        View Portfolio
                      </button>
                      <button 
                        onClick={() => handleContactGuide(guide)}
                        className="btn btn-success"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No guides found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}

        {/* Portfolio Modal */}
        {showPortfolio && selectedGuide && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModals}>&times;</button>
              <div className="modal-header">
                <img 
                  src={selectedGuide.profile_image_url || 'https://via.placeholder.com/150?text=Guide'} 
                  alt={selectedGuide.full_name} 
                  className="modal-avatar"
                />
                <div>
                  <h2>{selectedGuide.full_name}</h2>
                  <p className="modal-location">📍 {selectedGuide.covered_locations || 'Island Wide'}</p>
                  <p className="specialization" style={{ margin: 0, fontSize: '0.9rem' }}>{selectedGuide.specialization || 'Local Guide'}</p>
                </div>
              </div>
              <div className="modal-body">
                <div className="modal-section">
                  <h3>About Me</h3>
                  <p>{selectedGuide.bio || 'No bio available.'}</p>
                </div>
                
                <div className="modal-stats-grid">
                    <div className="modal-stat">
                        <span className="stat-icon">🕒</span>
                        <span className="stat-val">{selectedGuide.experience_years || 0}</span>
                        <span className="stat-lbl">Years Exp.</span>
                    </div>
                    <div className="modal-stat">
                        <span className="stat-icon">💬</span>
                        <span className="stat-val">{selectedGuide.languages?.split(',')[0] || 'English'}</span>
                        <span className="stat-lbl">Primary Lang.</span>
                    </div>
                    <div className="modal-stat">
                        <span className="stat-icon">📜</span>
                        <span className="stat-val">{selectedGuide.license_number ? 'Yes' : 'No'}</span>
                        <span className="stat-lbl">Licensed</span>
                    </div>
                </div>

                <div className="modal-section" style={{ marginTop: '20px' }}>
                    <h3>Languages</h3>
                    <p>{selectedGuide.languages || 'English'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => { setShowPortfolio(false); setShowContact(true); }}>Contact Guide</button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContact && selectedGuide && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-box modal-contact" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModals}>&times;</button>
              <h2>Contact {selectedGuide.full_name}</h2>
              <div className="modal-body">
                <p>Feel free to reach out to coordinate your journey:</p>
                <div className="contact-details">
                    {selectedGuide.contact_number ? (
                        <a href={`tel:${selectedGuide.contact_number}`} className="contact-item">
                            <span className="contact-phone">📞</span> {selectedGuide.contact_number}
                        </a>
                    ) : (
                        <div className="contact-item contact-missing">No phone provided</div>
                    )}
                    
                    <a href={`mailto:${selectedGuide.email}`} className="contact-item">
                        <span className="contact-email">📧</span> {selectedGuide.email}
                    </a>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={closeModals}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default TravelGuidePage;
