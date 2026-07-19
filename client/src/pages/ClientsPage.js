import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService, notificationService } from '../services';
import { FaPaperPlane, FaCalendarAlt, FaUser, FaChevronDown, FaChevronUp, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { io } from 'socket.io-client';
import './DashboardPage.css';

const ClientsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteCurrency, setQuoteCurrency] = useState('LKR');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingMessages, setBookingMessages] = useState({});
  const [messageTextByBooking, setMessageTextByBooking] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [unreadBookings, setUnreadBookings] = useState({});

  const socketRef = useRef(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await bookingService.getGuideBookings(user.id);
      setBookings(response.data.bookings || []);
    } catch (err) {
      setError('Failed to load client requests');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

    socketRef.current.on('new_message', (msg) => {
        setBookingMessages(prev => {
            const existing = prev[msg.booking_id] || [];
            if (existing.find(m => m.id === msg.id)) return prev;
            return { ...prev, [msg.booking_id]: [...existing, msg] };
        });
        
        if (msg.author_id !== user?.id) {
           setUnreadBookings(prev => ({ ...prev, [msg.booking_id]: true }));
        }
    });

    socketRef.current.on('edit_message', (msg) => {
        setBookingMessages(prev => ({
            ...prev,
            [msg.booking_id]: prev[msg.booking_id]?.map(m => m.id === msg.id ? msg : m) || []
        }));
    });

    socketRef.current.on('delete_message', (msg) => {
        setBookingMessages(prev => ({
            ...prev,
            [msg.booking_id]: prev[msg.booking_id]?.map(m => m.id === msg.id ? msg : m) || []
        }));
    });

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
    
    if (user?.id) {
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
  }, [fetchBookings, user?.id]);

  const fetchBookingMessages = useCallback(async (bookingId) => {
    try {
      const response = await bookingService.getBookingMessages(bookingId);
      setBookingMessages(prev => ({
        ...prev,
        [bookingId]: response.data.messages || []
      }));
    } catch (err) {
      console.error('Failed to load booking messages:', err);
    }
  }, []);

  useEffect(() => {
    bookings.forEach((booking) => {
      if (!bookingMessages[booking.id]) {
        fetchBookingMessages(booking.id);
      }
      if (socketRef.current) {
         socketRef.current.emit('join_booking', booking.id);
      }
    });
  }, [bookings, bookingMessages, fetchBookingMessages]);

  const handleQuotePrice = async (e) => {
    e.preventDefault();
    if (!quotePrice.trim()) {
      setError('Please enter a price quote');
      return;
    }

    try {
      setLoading(true);
      await bookingService.quotePrice(selectedBooking.id, quotePrice, quoteCurrency);
      setSuccess('Quote sent successfully!');
      setSelectedBooking(null);
      setQuotePrice('');
      setQuoteCurrency('LKR');
      fetchBookings();
    } catch (err) {
      setError('Failed to send quote');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      setLoading(true);
      await bookingService.rejectQuote(bookingId);
      setSuccess('Request rejected successfully');
      fetchBookings();
    } catch (err) {
      setError('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (bookingId) => {
    const message = (messageTextByBooking[bookingId] || '').trim();
    if (!message) return;

    try {
      await bookingService.sendBookingMessage(bookingId, {
        authorId: user.id,
        message
      });
      setMessageTextByBooking(prev => ({ ...prev, [bookingId]: '' }));
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleEditMessage = async (bookingId, messageId) => {
      if (!editMessageText.trim()) return;
      try {
          const res = await bookingService.editBookingMessage(bookingId, messageId, { message: editMessageText, authorId: user.id });
          
          if (res.data && res.data.success) {
              setBookingMessages(prev => ({
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
              setBookingMessages(prev => ({
                  ...prev,
                  [bookingId]: prev[bookingId]?.map(m => m.id === messageId ? res.data.message : m) || []
              }));
          }
      } catch (err) {
          setError(err.response?.data?.error || 'Failed to delete message');
      }
  };

  if (loading && bookings.length === 0) return <div className="container">Loading...</div>;

  return (
    <main className="dashboard-page">
      <div className="container">
        <h1>Client Requests</h1>
        <p>Manage your itinerary assistance requests from tourists</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          <section className="dashboard-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 style={{ color: 'var(--text-head)', fontWeight: '800' }}>Engagement Queue</h2>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No requests found yet.</p>
            ) : (
              <div className="bookings-list" style={{ marginTop: '20px' }}>
                {bookings.map(booking => (
                  <BookingRequestCard 
                    key={booking.id} 
                    booking={booking} 
                    user={user} 
                    messages={bookingMessages[booking.id] || []}
                    messageText={messageTextByBooking[booking.id] || ''}
                    onMessageChange={(val) => setMessageTextByBooking(prev => ({ ...prev, [booking.id]: val }))}
                    onSendMessage={() => handleSendMessage(booking.id)}
                    onSelectQuote={() => setSelectedBooking(booking)}
                    onReject={() => handleRejectBooking(booking.id)}
                    hasNotification={unreadBookings[booking.id]}
                    onClearNotification={() => {
                        setUnreadBookings(prev => {
                            const next = { ...prev };
                            delete next[booking.id];
                            return next;
                        });
                    }}
                    editingMessageId={editingMessageId}
                    setEditingMessageId={setEditingMessageId}
                    editMessageText={editMessageText}
                    setEditMessageText={setEditMessageText}
                    onSaveEdit={(msgId) => handleEditMessage(booking.id, msgId)}
                    onDeleteMessage={(msgId) => handleDeleteMessage(booking.id, msgId)}
                  />
                ))}
              </div>
            )}
          </section>

          {selectedBooking && (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(10px)'
            }}>
              <div className="modal-box" style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '32px',
                width: '95%',
                maxWidth: '550px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-head)', marginBottom: '24px' }}>Offer Price Quote</h3>
                <form onSubmit={handleQuotePrice}>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ color: 'var(--text-head)', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Professional Fee</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="number" 
                        className="auth-input"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        placeholder="Enter amount..."
                        style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800' }}
                        required
                      />
                      <select 
                        className="auth-input"
                        value={quoteCurrency}
                        onChange={(e) => setQuoteCurrency(e.target.value)}
                        style={{ width: '100px', padding: '16px', fontSize: '1.1rem', fontWeight: '800', backgroundColor: 'var(--bg-page)' }}
                      >
                        <option value="LKR">LKR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: '800' }}>Send Quote</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: '700' }} onClick={() => { setSelectedBooking(null); setQuotePrice(''); setQuoteCurrency('LKR'); }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const BookingRequestCard = ({ 
    booking, user, messages, messageText, onMessageChange, onSendMessage, onSelectQuote, onReject, 
    hasNotification, onClearNotification, editingMessageId, setEditingMessageId, editMessageText, setEditMessageText,
    onSaveEdit, onDeleteMessage
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
      if (showChat && hasNotification) {
          onClearNotification();
      }
  }, [showChat, hasNotification, onClearNotification]);

  const toggleChat = () => {
      setShowChat(!showChat);
      if (!showChat && hasNotification) {
          onClearNotification();
      }
  };

  const isEditable = (msg) => {
      if (String(msg.author_id) !== String(user.id)) return false;
      if (msg.is_deleted) return false;
      const msgTime = new Date(msg.created_at).getTime();
      const now = new Date().getTime();
      return (now - msgTime) <= 60 * 60 * 1000;
  };

  return (
    <div className="guide-request-card" data-status={booking.status}>
      <div className="guide-request-card__header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h3 className="guide-request-card__name">
              {booking.itinerary_title}
            </h3>
            <p className="guide-request-card__trip">
              <FaUser style={{ marginRight: '5px' }} /> {booking.tourist_name || 'Tourist'}
              <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>
              <FaCalendarAlt style={{ marginRight: '5px' }} /> {new Date(booking.start_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      <div className="guide-request-card__meta">
        <span className={`guide-request-pill guide-request-pill--${booking.status}`}>
          {booking.status}
        </span>
        
        {(booking.status === 'quoted' || booking.status === 'accepted') && (
          <div className="guide-request-card__price">
             <span className="guide-request-card__price-label">{booking.currency || 'LKR'}</span>
             <span className="guide-request-card__price-value">{booking.quoted_price}</span>
          </div>
        )}
      </div>

      {booking.status === 'pending' && (
        <div className="guide-request-actions guide-request-actions--split" style={{ marginTop: '0.5rem' }}>
          <button className="guide-request-btn guide-request-btn--success" onClick={onSelectQuote}>
            Quote Price
          </button>
          <button className="guide-request-btn guide-request-btn--danger-outline" onClick={onReject}>
            <FaTimes className="guide-request-btn__icon" /> Reject
          </button>
        </div>
      )}
      
      {isExpanded && (
        <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {booking.notes && (
            <div className="guide-request-contact">
              <div className="guide-request-contact__line">
                <span className="guide-request-contact__key">Notes:</span>
                <span>"{booking.notes}"</span>
              </div>
            </div>
          )}
          
          {booking.status === 'accepted' && (
            <div className="guide-request-contact">
              <div className="guide-request-contact__line">
                <span className="guide-request-contact__key">Contact:</span>
                <a href={`tel:${booking.tourist_contact}`}>{booking.tourist_contact}</a>
              </div>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Proposed Route</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {booking.itinerary_places?.map(place => (
                <span key={place.place_id} style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: '600' }}>
                  {place.visit_order}. {place.name}
                </span>
              ))}
            </div>
          </div>

          <button 
            onClick={toggleChat}
            className="guide-request-btn guide-request-btn--secondary"
            style={{ width: '100%', position: 'relative' }}
          >
            {showChat ? 'Hide Messenger' : 'Open Messenger Channel'}
            {hasNotification && <span style={{ position: 'absolute', right: '10px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </button>

          {showChat && (
            <div className="guide-request-messenger" style={{ marginTop: '15px' }}>
              <h4 className="guide-request-messenger__title">Conversation</h4>
              
              {messages.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No messages yet. Start the conversation!</p>
              ) : (
                <div className="guide-request-messenger__thread-wrap">
                  <div className="guide-request-messenger__thread">
                    {messages.map(m => (
                      <div
                        key={m.id}
                        className={`guide-request-bubble ${String(m.author_id) === String(user.id) ? 'guide-request-bubble--me' : 'guide-request-bubble--guide'}`}
                      >
                        <div className="guide-request-bubble__meta">
                          <strong className="guide-request-bubble__who">
                            {String(m.author_id) === String(user.id) ? 'You' : 'Tourist'}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isEditable(m) && !editingMessageId && (
                                <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                                    <button onClick={() => { setEditingMessageId(m.id); setEditMessageText(m.message); }} style={{ background: 'none', border: 'none', color: 'currentColor', opacity: 0.7, cursor: 'pointer', padding: 0 }}><FaEdit /></button>
                                    <button onClick={() => onDeleteMessage(m.id)} style={{ background: 'none', border: 'none', color: 'currentColor', opacity: 0.7, cursor: 'pointer', padding: 0 }}><FaTrash /></button>
                                </div>
                            )}
                          </div>
                        </div>
                        
                        {editingMessageId === m.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                                <input type="text" value={editMessageText} onChange={(e) => setEditMessageText(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: 'none', color: 'black' }} />
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setEditingMessageId(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.7rem' }}>Cancel</button>
                                    <button onClick={() => onSaveEdit(m.id)} style={{ background: 'white', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Save</button>
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
                  value={messageText || ''}
                  onChange={(e) => onMessageChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSendMessage();
                    }
                  }}
                  placeholder="Type message..."
                />
                <button
                  type="button"
                  className="guide-request-messenger__send"
                  aria-label="Send message"
                  onClick={onSendMessage}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
