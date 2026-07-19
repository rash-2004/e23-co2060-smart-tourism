import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBell, FaCheck, FaCheckDouble, FaArrowLeft, FaInfoCircle, FaEnvelope, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { user, setUnreadNotificationCount, clearUnreadNotifications } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user || !user.id) return;
    try {
      setLoading(true);
      const res = await notificationService.getUserNotifications(user.id);
      if (res.data.success) {
        setNotifications(res.data.notifications);
        
        // Immediately clear the red dot from the top menu and mark as read in the DB in the background
        const hasUnread = res.data.notifications.some(n => !n.is_read);
        if (hasUnread) {
            clearUnreadNotifications();
            notificationService.markAllAsRead(user.id).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(user.id, id);
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id);
        if (notif && !notif.is_read) {
           setUnreadNotificationCount(count => Math.max(0, count - 1));
        }
        return prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      });
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      clearUnreadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id, { stopPropagation: () => {} });
    }

    if (notification.reference_id) {
      // Navigate to the relevant booking
      if (user?.role === 'guide') {
        navigate('/clients');
      } else {
        navigate('/travel-guides');
      }
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'new_message': return <FaEnvelope className="notif-icon text-primary" />;
      case 'quote_received': return <FaInfoCircle className="notif-icon text-success" />;
      case 'quote_accepted': return <FaCheck className="notif-icon text-success" />;
      case 'quote_rejected': return <FaExclamationCircle className="notif-icon text-danger" />;
      default: return <FaBell className="notif-icon text-primary" />;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <motion.div 
      className="notifications-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="notif-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FaArrowLeft /> Back
        </button>
        <h2>Your Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="mark-all-btn">
            <FaCheckDouble /> Mark all as read
          </button>
        )}
      </div>

      <div className="notif-list">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="no-notifs">
            <FaBell className="empty-icon" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <motion.div 
              key={notif.id}
              className={`notif-card ${notif.is_read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notif)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="notif-icon-wrapper">
                {getIconForType(notif.type)}
              </div>
              <div className="notif-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span className="notif-time">{formatTime(notif.created_at)}</span>
              </div>
              {!notif.is_read && (
                <button 
                  className="mark-read-btn" 
                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                  title="Mark as read"
                >
                  <FaCheck />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
