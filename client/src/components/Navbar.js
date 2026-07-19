import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { bookingService } from '../services';
import { FaMapMarkerAlt, FaCompass, FaUser, FaSignOutAlt, FaHome, FaMoon, FaSun, FaRoute, FaAtlas, FaBriefcase, FaComments, FaMapMarkedAlt, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, unreadNotificationCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaCompass className="navbar-icon" />
          Tourism System
        </Link>
        
        <ul className="nav-menu">
          <li>
            <button 
              onClick={toggleTheme} 
              className={`theme-toggle-btn ${isDarkMode ? 'dark-mode-btn' : 'light-mode-btn'}`}
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <><FaSun size={14} /> <span>Light</span></>
              ) : (
                <><FaMoon size={14} /> <span>Dark</span></>
              )}
            </button>
          </li>
          <li>
            <Link to="/" className="nav-link">
              <FaHome /> Home
            </Link>
          </li>
          {(!isAuthenticated() || user?.role === 'tourist') && (
            <li>
              <Link to="/places" className="nav-link">
                <FaMapMarkerAlt /> Places
              </Link>
            </li>
          )}
          {user?.role !== 'admin' && (
            <li>
              <Link to="/travel-guides" className="nav-link">
                <FaCompass /> Travel Guides
              </Link>
            </li>
          )}
          
          {isAuthenticated() ? (
            <>
              {user?.role === 'tourist' && (
                <li>
                  <Link to="/itinerary" className="nav-link">
                    <FaAtlas /> My Itinerary
                  </Link>
                </li>
              )}
              {user?.role === 'guide' && (
                <li>
                  <Link to="/clients" className="nav-link">
                    <FaBriefcase /> Clients
                  </Link>
                </li>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin-dashboard?tab=tourists" className="nav-link">
                      <FaUser /> Tourists
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin-dashboard?tab=guides" className="nav-link">
                      <FaMapMarkedAlt /> Travel Guides
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin-dashboard?tab=comments" className="nav-link">
                      <FaComments /> Comments
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/notifications" className="nav-link" style={{ position: 'relative' }}>
                  <FaBell /> Notifications
                  {unreadNotificationCount > 0 && (
                    <span className="notif-badge">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="nav-link">
                  <FaUser /> Dashboard
                </Link>
              </li>
              <li className="nav-user">
                <button onClick={handleLogout} className="nav-link logout-btn">
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link login-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="nav-link register-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
