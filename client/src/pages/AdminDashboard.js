import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import './AdminDashboard.css';
import { FaTrash, FaUser, FaComments, FaMapMarkedAlt } from 'react-icons/fa';
import { formatUserId } from '../utils/formatters';
import ChangePasswordModal from '../components/ChangePasswordModal';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'tourists';
  const [commentsSubTab, setCommentsSubTab] = useState('places');
  const [tourists, setTourists] = useState([]);
  const [guides, setGuides] = useState([]);
  const [placeComments, setPlaceComments] = useState([]);
  const [guideComments, setGuideComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, commentsSubTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'comments') {
        const endpoint = `/api/admin/comments/${commentsSubTab}`;
        const response = await API.get(endpoint);
        if (commentsSubTab === 'places') setPlaceComments(response.data.comments);
        if (commentsSubTab === 'guides') setGuideComments(response.data.comments);
      } else {
        const endpoint = `/api/admin/${tab}`;
        const response = await API.get(endpoint);
        if (tab === 'tourists') setTourists(response.data.tourists);
        if (tab === 'guides') setGuides(response.data.guides);
      }
    } catch (err) {
      setError(`Failed to fetch ${tab}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'comments' ? 'comment' : type.slice(0, -1)}?`)) return;
    try {
      if (type === 'comments') {
        await API.delete(`/api/admin/comments/${commentsSubTab}/${id}`);
      } else {
        await API.delete(`/api/admin/${type}/${id}`);
      }
      fetchData(type);
    } catch (err) {
      setError(`Failed to delete.`);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>Admin Control Panel</h1>
          <p>Manage users, guides, and platform content.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-content">
        {(activeTab === 'tourists' || activeTab === 'guides') && (
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-body)' }}
            />
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {activeTab === 'tourists' && (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Full Name</th>
                      <th>Contact Number</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tourists.filter(t => {
                      if (!searchId) return true;
                      const formatted = formatUserId(t.user_id, 'tourist').toLowerCase();
                      const name = (t.full_name || '').toLowerCase();
                      const query = searchId.toLowerCase();
                      return formatted.includes(query) || name.includes(query);
                    }).map(t => (
                      <tr key={t.user_id}>
                        <td>{formatUserId(t.user_id, 'tourist')}</td>
                        <td>{t.email}</td>
                        <td>{t.full_name || 'N/A'}</td>
                        <td>{t.contact_number || 'N/A'}</td>
                        <td>
                          <button className="btn-delete" onClick={() => handleDelete('tourists', t.user_id)}>
                            <FaTrash /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tourists.length === 0 && (
                      <tr><td colSpan="4" style={{textAlign: 'center'}}>No tourists found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'guides' && (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Full Name</th>
                      <th>License</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guides.filter(g => {
                      if (!searchId) return true;
                      const formatted = formatUserId(g.user_id, 'guide').toLowerCase();
                      const name = (g.full_name || '').toLowerCase();
                      const query = searchId.toLowerCase();
                      return formatted.includes(query) || name.includes(query);
                    }).map(g => (
                      <tr key={g.user_id}>
                        <td>{formatUserId(g.user_id, 'guide')}</td>
                        <td>{g.email}</td>
                        <td>{g.full_name || 'N/A'}</td>
                        <td>{g.license_number || 'N/A'}</td>
                        <td>
                          <button className="btn-delete" onClick={() => handleDelete('guides', g.user_id)}>
                            <FaTrash /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {guides.length === 0 && (
                      <tr><td colSpan="4" style={{textAlign: 'center'}}>No travel guides found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="table-container">
                <div className="comments-submenu">
                  <button 
                    className={`btn-submenu ${commentsSubTab === 'places' ? 'active' : ''}`}
                    onClick={() => setCommentsSubTab('places')}
                  >
                    Place Reviews
                  </button>
                  <button 
                    className={`btn-submenu ${commentsSubTab === 'guides' ? 'active' : ''}`}
                    onClick={() => setCommentsSubTab('guides')}
                  >
                    Guide Reviews
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Target ({commentsSubTab === 'places' ? 'Place' : 'Guide'})</th>
                      <th>Author</th>
                      <th>Comment</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(commentsSubTab === 'places' ? placeComments : guideComments).map(c => (
                      <tr key={c.id}>
                        <td>{c.target_name}</td>
                        <td>{c.author_name}</td>
                        <td>{c.title ? `${c.title} - ` : ''}{c.comment}</td>
                        <td>{c.rating}/5</td>
                        <td>
                          <button className="btn-delete" onClick={() => handleDelete('comments', c.id)}>
                            <FaTrash /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(commentsSubTab === 'places' ? placeComments : guideComments).length === 0 && (
                      <tr><td colSpan="5" style={{textAlign: 'center'}}>No comments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
