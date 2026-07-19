import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guideService, bookingService, notificationService } from '../services';
import SearchBar from '../components/SearchBar';
import ReviewSection from '../components/ReviewSection';
import { FaAward, FaDollarSign, FaLanguage, FaHistory, FaCheckCircle, FaMapPin, FaTrophy, FaIdCard, FaPaperPlane, FaClipboardList, FaComments, FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import { formatUserId } from '../utils/formatters';
import { io } from 'socket.io-client';
import './TravelGuidePage.css';

const TravelGuidePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [guides, setGuides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [bookingMessagesByBooking, setBookingMessagesByBooking] = useState({});
  const [messageTextByBooking, setMessageTextByBooking] = useState({});
  const [unreadBookings, setUnreadBookings] = useState({});
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const socketRef = useRef(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await bookingService.getTouristBookings(user.id);
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  }, [user?.id]);

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

  const handleDeleteBooking = async (bookingId) => {
    try {
      setError('');
      setSuccess('');
      await bookingService.deleteBooking(bookingId, { authorId: user.id });
      setSuccess('Booking request deleted successfully.');
      fetchBookings();
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError(err.response?.data?.error || 'Failed to delete booking request.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError('');
      setSuccess('');
      await bookingService.cancelBooking(bookingId, { authorId: user.id });
      setSuccess('Booking request cancelled successfully.');
      fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.error || 'Failed to cancel booking request.');
    }
  };

  const fetchGuides = useCallback(async () => {
    try {
      setLoading(true);
      const response = await guideService.getAllGuides();
      const guideList = response.data.guides || [];
      setGuides(guideList);
      setFilteredGuides(guideList);
    } catch (err) {
      setError('Failed to load travel guides');
      console.error('Error fetching guides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookingMessagesForId = useCallback(async (bookingId) => {
    try {
      const response = await bookingService.getBookingMessages(bookingId);
      setBookingMessagesByBooking(prev => ({
        ...prev,
        [bookingId]: response.data.messages || []
      }));
    } catch (err) {
      console.error('Error loading booking messages:', err);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
    if (user?.role === 'tourist') {
      fetchBookings();
      // Fetch unread notifications to highlight chats
      notificationService.getUserNotifications(user.id).then(res => {
         if (res.data.success) {
             const unreadMsgNotifs = res.data.notifications.filter(n => !n.is_read && n.type === 'new_message');
             const unreadMap = {};
             unreadMsgNotifs.forEach(n => {
                 if (n.reference_id) unreadMap[n.reference_id] = true;
             });
             setUnreadBookings(unreadMap);
         }
      }).catch(err => console.error(err));
    }
  }, [user?.role, user?.id, fetchGuides, fetchBookings]);

  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

    socketRef.current.on('new_message', (msg) => {
        setBookingMessagesByBooking(prev => {
            const existing = prev[msg.booking_id] || [];
            if (existing.find(m => m.id === msg.id)) return prev;
            return { ...prev, [msg.booking_id]: [...existing, msg] };
        });
        
        if (msg.author_id !== user?.id) {
           setUnreadBookings(prev => ({ ...prev, [msg.booking_id]: true }));
        }
    });

    socketRef.current.on('edit_message', (msg) => {
        setBookingMessagesByBooking(prev => ({
            ...prev,
            [msg.booking_id]: prev[msg.booking_id]?.map(m => m.id === msg.id ? msg : m) || []
        }));
    });

    socketRef.current.on('delete_message', (msg) => {
        setBookingMessagesByBooking(prev => ({
            ...prev,
            [msg.booking_id]: prev[msg.booking_id]?.map(m => m.id === msg.id ? msg : m) || []
        }));
    });

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user?.id]);

  // Handle auto-opening portfolio from dashboard
  useEffect(() => {
    if (location.state?.openProfileId && guides.length > 0) {
      const targetId = String(location.state.openProfileId);
      const guideToOpen = guides.find(g => String(g.id) === targetId);
      if (guideToOpen) {
        setSelectedGuide(guideToOpen);
        setShowPortfolio(true);
      }
    }
  }, [location.state, guides]);

  const handleSendBookingMessage = async (bookingId) => {
    const message = messageTextByBooking[bookingId] || '';
    if (!message.trim()) {
      setError('Please enter a message before sending.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await bookingService.sendBookingMessage(bookingId, {
        authorId: user.id,
        message: message.trim()
      });
      setMessageTextByBooking(prev => ({ ...prev, [bookingId]: '' }));
    } catch (err) {
      console.error('Error sending booking message:', err);
      setError(err.response?.data?.error || 'Failed to send message.');
    }
  };

  const handleEditMessage = async (bookingId, messageId) => {
      if (!editMessageText.trim()) return;
      try {
          const res = await bookingService.editBookingMessage(bookingId, messageId, { message: editMessageText, authorId: user.id });
          
          if (res.data && res.data.success) {
              setBookingMessagesByBooking(prev => ({
                  ...prev,
                  [bookingId]: prev[bookingId]?.map(m => m.id === messageId ? res.data.message : m) || []
              }));
          }
          
          setEditingMessageId(null);
          setEditMessageText('');
      } catch (err) {
          setError(err.response?.data?.error || 'Failed to edit message');
      }
  };

  const handleDeleteMessage = async (bookingId, messageId) => {
      if (!window.confirm('Are you sure you want to delete this message?')) return;
      try {
          const res = await bookingService.deleteBookingMessage(bookingId, messageId, { authorId: user.id });
          
          if (res.data && res.data.success) {
              setBookingMessagesByBooking(prev => ({
                  ...prev,
                  [bookingId]: prev[bookingId]?.map(m => m.id === messageId ? res.data.message : m) || []
              }));
          }
      } catch (err) {
          setError(err.response?.data?.error || 'Failed to delete message');
      }
  };

  const isEditable = (msg) => {
      if (String(msg.author_id) !== String(user.id)) return false;
      if (msg.is_deleted) return false;
      const msgTime = new Date(msg.created_at).getTime();
      const now = new Date().getTime();
      return (now - msgTime) <= 60 * 60 * 1000;
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const filtered = guides.filter(guide =>
        (guide.full_name || '').toLowerCase().includes(q) ||
        (guide.specialization || '').toLowerCase().includes(q) ||
        (guide.bio || '').toLowerCase().includes(q) ||
        (guide.id && formatUserId(guide.id, 'guide').toLowerCase().includes(q)) ||
        (guide.user_id && formatUserId(guide.user_id, 'guide').toLowerCase().includes(q))
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

  useEffect(() => {
    if (user?.role !== 'tourist') return;
    bookings.forEach((booking) => {
      fetchBookingMessagesForId(booking.id);
      if (socketRef.current) {
          socketRef.current.emit('join_booking', booking.id);
      }
    });
  }, [bookings, user?.role, fetchBookingMessagesForId]);

  useEffect(() => {
      if (expandedBookingId && unreadBookings[expandedBookingId]) {
          setUnreadBookings(prev => {
              const next = { ...prev };
              delete next[expandedBookingId];
              return next;
          });
      }
  }, [expandedBookingId, unreadBookings]);

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
          <section className="guide-requests-section" aria-labelledby="guide-requests-heading">
            <div className="guide-requests-section__head">
              <FaClipboardList className="guide-requests-section__icon" aria-hidden />
              <h2 id="guide-requests-heading" className="guide-requests-section__title">
                My Guide Requests
              </h2>
            </div>
            <div className="guide-requests-grid">
              {bookings.map(booking => (
                <article
                  key={booking.id}
                  className="guide-request-card"
                  data-status={booking.status}
                >
                  <header className="guide-request-card__header">
                    <div>
                      <h3 className="guide-request-card__name">{booking.guide_name}</h3>
                      <p className="guide-request-card__trip">{booking.itinerary_title}</p>
                    </div>
                  </header>

                  <div className="guide-request-card__meta">
                    <span className={`guide-request-pill guide-request-pill--${booking.status}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                    {booking.quoted_price != null && booking.quoted_price !== '' && (
                      <span className="guide-request-card__price">
                        <span className="guide-request-card__price-label">Quote</span>
                        <span className="guide-request-card__price-value">{booking.currency || 'LKR'} {booking.quoted_price}</span>
                      </span>
                    )}
                  </div>

                  {booking.status === 'accepted' && (
                    <div className="guide-request-contact">
                      <p className="guide-request-contact__line">
                        <span className="guide-request-contact__key">Phone</span>
                        <a href={`tel:${booking.guide_contact}`}>{booking.guide_contact || '—'}</a>
                      </p>
                      <p className="guide-request-contact__line">
                        <span className="guide-request-contact__key">Email</span>
                        {booking.guide_email ? (
                          <a href={`mailto:${booking.guide_email}`}>{booking.guide_email}</a>
                        ) : (
                          <span className="guide-request-contact__empty">—</span>
                        )}
                      </p>
                    </div>
                  )}

                  {booking.status === 'quoted' && (
                    <div className="guide-request-actions guide-request-actions--split">
                      <button
                        type="button"
                        className="guide-request-btn guide-request-btn--success"
                        onClick={() => handleBookingAction(booking.id, 'accept')}
                      >
                        Accept price
                      </button>
                      <button
                        type="button"
                        className="guide-request-btn guide-request-btn--danger-outline"
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {booking.status === 'pending' && (
                    <div className="guide-request-actions">
                      <button
                        type="button"
                        className="guide-request-btn guide-request-btn--danger-outline"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel request
                      </button>
                    </div>
                  )}

                  {(booking.status === 'cancelled' || booking.status === 'rejected') && (
                    <div className="guide-request-actions">
                      <button
                        type="button"
                        className="guide-request-btn guide-request-btn--danger"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        Delete request
                      </button>
                    </div>
                  )}

                  <div className="guide-request-actions">
                    <button
                      type="button"
                      className="guide-request-btn guide-request-btn--secondary"
                      onClick={() => {
                          setExpandedBookingId(prev => (prev === booking.id ? null : booking.id));
                      }}
                    >
                      <FaComments className="guide-request-btn__icon" aria-hidden />
                      {expandedBookingId === booking.id ? 'Hide messages' : 'Messages'}
                      {unreadBookings[booking.id] && <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', marginLeft: '5px' }}></span>}
                    </button>
                  </div>

                  {expandedBookingId === booking.id && (
                    <div className="guide-request-messenger">
                      <h4 className="guide-request-messenger__title">Conversation</h4>
                      
                      {bookingMessagesByBooking[booking.id]?.length > 0 && (
                        <div className="guide-request-messenger__thread-wrap">
                          <div className="guide-request-messenger__thread">
                            {bookingMessagesByBooking[booking.id].map(m => (
                              <div
                                key={m.id}
                                className={`guide-request-bubble ${String(m.author_id) === String(user.id) ? 'guide-request-bubble--me' : 'guide-request-bubble--guide'}`}
                              >
                                <div className="guide-request-bubble__meta">
                                  <strong className="guide-request-bubble__who">
                                    {String(m.author_id) === String(user.id) ? 'You' : 'Guide'}
                                  </strong>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isEditable(m) && !editingMessageId && (
                                        <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                                            <button onClick={() => { setEditingMessageId(m.id); setEditMessageText(m.message); }} style={{ background: 'none', border: 'none', color: 'currentColor', opacity: 0.7, cursor: 'pointer', padding: 0 }}><FaEdit /></button>
                                            <button onClick={() => handleDeleteMessage(booking.id, m.id)} style={{ background: 'none', border: 'none', color: 'currentColor', opacity: 0.7, cursor: 'pointer', padding: 0 }}><FaTrash /></button>
                                        </div>
                                    )}
                                  </div>
                                </div>
                                
                                {editingMessageId === m.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                                        <input type="text" value={editMessageText} onChange={(e) => setEditMessageText(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: 'none', color: 'black' }} />
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setEditingMessageId(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.7rem' }}>Cancel</button>
                                            <button onClick={() => handleEditMessage(booking.id, m.id)} style={{ background: 'white', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="guide-request-bubble__text" style={{ fontStyle: m.is_deleted ? 'italic' : 'normal', opacity: m.is_deleted ? 0.7 : 1 }}>
                                        {m.message}
                                        {m.is_edited && !m.is_deleted && <span style={{ fontSize: '0.65rem', marginLeft: '5px', opacity: 0.7 }}>(edited)</span>}
                                    </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="guide-request-messenger__composer">
                        <input
                          type="text"
                          className="guide-request-messenger__input"
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
                        />
                        <button
                          type="button"
                          className="guide-request-messenger__send"
                          aria-label="Send message"
                          onClick={() => handleSendBookingMessage(booking.id)}
                        >
                          <FaPaperPlane />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="loading">Loading travel guides...</div>
        ) : filteredGuides.length > 0 ? (
          <div>
            <p className="results-count">Found {filteredGuides.length} guide(s)</p>
            <div className="guides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>

              {filteredGuides.map(guide => (
                <div key={guide.id} className="guide-card">
                  <div className="guide-image">
                    <img 
                      src={guide.profile_image_url || 'https://via.placeholder.com/150?text=Guide'} 
                      alt={guide.full_name} 
                    />
                  </div>
                  <div className="guide-content">
                    <div className="guide-header">
                      <div>
                        <h3>{guide.full_name}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>ID: {formatUserId(guide.user_id || guide.id, 'guide')}</span>
                      </div>
                      {guide.license_number && (
                        <span className="professional-badge">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      {guide.review_count > 0 ? (
                        <p className="rating" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b', fontWeight: 'bold', margin: '5px 0' }}>
                          <FaStar /> {parseFloat(guide.average_rating).toFixed(1)} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>({guide.review_count} reviews)</span>
                        </p>
                      ) : (
                        <p className="rating" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.9rem', margin: '5px 0' }}>
                          No reviews yet
                        </p>
                      )}
                    </div>
                    
                    <div className="guide-actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewPortfolio(guide);
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', borderRadius: '10px', padding: '10px', fontSize: '0.9rem', fontWeight: '700' }}
                      >
                        View Portfolio
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContactGuide(guide);
                        }}
                        className="btn btn-outline"
                        style={{ width: '100%', borderRadius: '10px', padding: '10px', fontSize: '0.9rem', fontWeight: '600', marginTop: '8px', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-body)' }}
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
                  <h2>{selectedGuide.full_name} <span style={{ fontSize: '0.9rem', color: 'var(--primary)', marginLeft: '10px' }}>ID: {formatUserId(selectedGuide.user_id || selectedGuide.id, 'guide')}</span></h2>
                  <p className="modal-location">📍 {selectedGuide.covered_locations || 'Island Wide'}</p>
                  <p className="specialization" style={{ margin: 0, fontSize: '0.9rem' }}>{selectedGuide.specialization || 'Local Guide'}</p>
                </div>
              </div>
              <div className="modal-body">
                <div className="modal-section">
                  <h3>About Me</h3>
                  <p>{selectedGuide.bio || 'No bio available.'}</p>
                </div>
                          <div className="modal-stats-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                  gap: '15px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)'
                }}>
                    <div className="modal-stat" style={{ textAlign: 'center' }}>
                        <FaHistory style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '8px' }} />
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-head)' }}>{selectedGuide.experience_years || 0}</div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Years Exp.</div>
                    </div>
                    <div className="modal-stat" style={{ textAlign: 'center' }}>
                        <FaLanguage style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '8px' }} />
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-head)' }}>{selectedGuide.languages?.split(',')[0] || 'English'}</div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Primary</div>
                    </div>
                    <div className="modal-stat" style={{ textAlign: 'center' }}>
                        <FaIdCard style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '8px' }} />
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-head)' }}>{selectedGuide.license_number ? 'Yes' : 'No'}</div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Licensed</div>
                    </div>
                      <div className="modal-stat" style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-head)', marginTop: '8px' }}>{selectedGuide.hourly_rate}</div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hourly Rate (LKR)</div>
                      </div>
                </div>

                <div className="modal-section" style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Linguistic Proficiency</h3>
                    <p style={{ fontWeight: '600' }}>{selectedGuide.languages || 'English'}</p>
                </div>

                <div className="modal-section" style={{ marginTop: '30px' }}>
                    <ReviewSection targetId={selectedGuide.user_id || selectedGuide.id} type="guide" />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
                <button 
                  className="btn btn-success" 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} 
                  onClick={() => { setShowPortfolio(false); setShowContact(true); }}
                >
                  Connect with this Guide
                </button>
              </div>
            </div>
          </div>
        )}

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
