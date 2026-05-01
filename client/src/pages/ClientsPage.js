import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services';
import './DashboardPage.css'; // Reuse dashboard styles

const ClientsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingMessages, setBookingMessages] = useState({});
  const [messageTextByBooking, setMessageTextByBooking] = useState({});

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBooking) {
      fetchBookingMessages(selectedBooking.id);
    }
  }, [selectedBooking]);

  useEffect(() => {
    bookings.forEach((booking) => {
      if (!bookingMessages[booking.id]) {
        fetchBookingMessages(booking.id);
      }
    });
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getGuideBookings(user.id);
      setBookings(response.data.bookings || []);
    } catch (err) {
      setError('Failed to load client requests');
    } finally {
      setLoading(false);
    }
  };

  const handleQuotePrice = async (e) => {
    e.preventDefault();
    if (!quotePrice.trim()) {
      setError('Please enter a price quote');
      return;
    }

    try {
      setLoading(true);
      // Now sending as string to allow currency symbols
      await bookingService.quotePrice(selectedBooking.id, quotePrice);
      setSuccess('Quote sent successfully!');
      setSelectedBooking(null);
      setQuotePrice('');
      setMessageText('');
      fetchBookings();
    } catch (err) {
      setError('Failed to send quote');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingMessages = async (bookingId) => {
    try {
      const response = await bookingService.getBookingMessages(bookingId);
      setBookingMessages(prev => ({
        ...prev,
        [bookingId]: response.data.messages || []
      }));
    } catch (err) {
      console.error('Failed to load booking messages:', err);
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
      setMessageTextByBooking(prev => ({
        ...prev,
        [bookingId]: ''
      }));
      fetchBookingMessages(bookingId);
      setSuccess('Message sent to the tourist');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      setLoading(true);
      await bookingService.acceptQuote(bookingId);
      setSuccess('Booking accepted!');
      fetchBookings();
    } catch (err) {
      setError('Failed to accept booking');
    } finally {
      setLoading(false);
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

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2>Recent Requests</h2>
            {bookings.length === 0 ? (
              <p>No requests found yet.</p>
            ) : (
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-item" style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>{booking.itinerary_title}</h4>
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <p><strong>Tourist:</strong> {booking.tourist_email}</p>
                    <p><strong>Dates:</strong> {booking.start_date} to {booking.end_date}</p>
                    {booking.notes && <p><em>"{booking.notes}"</em></p>}

                    {booking.itinerary_places && booking.itinerary_places.length > 0 && (
                      <div style={{ backgroundColor: '#f7f9fc', padding: '12px', borderRadius: '10px', margin: '12px 0' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Trip plan</p>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569' }}>
                          {booking.itinerary_places.map((place) => (
                            <li key={place.place_id} style={{ marginBottom: '6px' }}>
                              {place.visit_order}. {place.name} {place.category ? `(${place.category})` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {booking.status === 'pending' && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        Quote a Price
                      </button>
                    )}

                    {booking.status === 'quoted' && (
                      <p style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                        Quoted Price: {booking.quoted_price}
                      </p>
                    )}

                    {booking.status === 'accepted' && (
                      <div style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                        <p style={{ color: '#2e7d32', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                          ✅ Booking Confirmed for {booking.quoted_price}
                        </p>
                        <div style={{ fontSize: '0.9rem', borderTop: '1px solid #c8e6c9', paddingTop: '10px' }}>
                          <p><strong>Name:</strong> {booking.tourist_name}</p>
                          <p><strong>Contact:</strong> <a href={`tel:${booking.tourist_contact}`} style={{ color: '#2e7d32', fontWeight: 'bold' }}>{booking.tourist_contact}</a></p>
                          <p><strong>Email:</strong> {booking.tourist_email}</p>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '18px', padding: '16px', backgroundColor: '#f7f9fc', borderRadius: '10px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>Message Tourist</h4>
                      <textarea
                        rows={3}
                        value={messageTextByBooking[booking.id] || ''}
                        onChange={(e) => setMessageTextByBooking(prev => ({
                          ...prev,
                          [booking.id]: e.target.value
                        }))}
                        placeholder="Type a message to the tourist..."
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', marginBottom: '10px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleSendMessage(booking.id)}
                      >
                        Send Message
                      </button>

                      {bookingMessages[booking.id]?.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <h5 style={{ margin: '0 0 10px 0' }}>Conversation</h5>
                          {bookingMessages[booking.id].map(message => (
                            <div key={message.id} style={{ marginBottom: '10px', padding: '12px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                                <strong>{message.author_email === user.email ? 'You' : message.author_email || 'Tourist'}</strong> • {new Date(message.created_at).toLocaleString()}
                              </div>
                              <div style={{ color: '#111827' }}>{message.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedBooking && (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
              <div className="modal-box" style={{
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '12px',
                  maxWidth: '400px',
                  width: '90%'
              }}>
                <h3>Quote Price for {selectedBooking.itinerary_title}</h3>
                <form onSubmit={handleQuotePrice}>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Assistance Fee (Include Currency)</label>
                    <input 
                      type="text" 
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder="e.g. 50 USD or 5000 LKR"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Quote</button>
                    <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setSelectedBooking(null)}>Cancel</button>
                  </div>
                </form>
                <div style={{ marginTop: '18px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Message the Tourist</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      rows={3}
                      value={messageTextByBooking[selectedBooking?.id] || ''}
                      onChange={(e) => setMessageTextByBooking(prev => ({
                        ...prev,
                        [selectedBooking.id]: e.target.value
                      }))}
                      placeholder="Write a quick update or ask a question..."
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db' }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => handleSendMessage(selectedBooking.id)}>Send Message</button>
                  </div>
                  {bookingMessages[selectedBooking?.id]?.length > 0 && (
                    <div style={{ marginTop: '18px', maxHeight: '220px', overflowY: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                      <h5 style={{ margin: '0 0 10px 0' }}>Message History</h5>
                      {bookingMessages[selectedBooking.id].map(message => (
                        <div key={message.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}><strong>{message.author_email || 'User'}</strong> • {new Date(message.created_at).toLocaleString()}</div>
                          <div style={{ color: '#111827' }}>{message.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ClientsPage;
