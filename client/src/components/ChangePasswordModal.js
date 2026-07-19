import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChangePasswordModal = ({ onClose }) => {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordMsg({ text: '', type: '' });
    try {
      const res = await API.post(`/api/users/${user.id}/change-password`, passwordForm);
      setPasswordMsg({ text: res.data.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.error || 'Failed to change password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', maxWidth: '400px', width: '100%', border: '1px solid var(--border-color)' }}>
        <h2 style={{ color: 'var(--text-head)', marginBottom: '20px' }}>Change Password</h2>
        {passwordMsg.text && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', background: passwordMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: passwordMsg.type === 'error' ? '#ef4444' : '#22c55e' }}>
            {passwordMsg.text}
          </div>
        )}
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-body)' }}>Current Password</label>
            <input 
              type="password" 
              value={passwordForm.oldPassword} 
              onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-body)' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-body)' }}>New Password</label>
            <input 
              type="password" 
              value={passwordForm.newPassword} 
              onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-body)' }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }} disabled={loading}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer' }} disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
