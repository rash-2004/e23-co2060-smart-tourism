import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const globalSocketRef = useRef(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && user.id) {
        // Fetch initial count
        API.get(`/api/notifications/${user.id}/unread-count`).then(res => {
            if (res.data.success) setUnreadNotificationCount(res.data.count);
        }).catch(err => console.error('Failed to fetch unread count:', err));

        globalSocketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
        globalSocketRef.current.emit('join_user', user.id);
        
        globalSocketRef.current.on('global_notification', (data) => {
            setUnreadNotificationCount(prev => prev + 1);
        });

        return () => {
            if (globalSocketRef.current) globalSocketRef.current.disconnect();
        };
    }
  }, [user]);

  const clearUnreadNotifications = () => setUnreadNotificationCount(0);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await API.post('/api/auth/login', { email, password });
      
      if (response.data.requires_otp) {
        return { success: true, requires_otp: true, email: response.data.email };
      }

      const { user: userData, token: authToken } = response.data;
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, role = 'tourist', additionalData = {}) => {
    try {
      setLoading(true);
      const response = await API.post('/api/auth/register', { 
        email, 
        password, 
        role,
        ...additionalData
      });
      
      if (response.data.token && response.data.user) {
        const { user: userData, token: authToken } = response.data;
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
        API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      setLoading(true);
      const response = await API.post('/api/auth/verify-email', { email, code });
      return { success: true, user: response.data.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Verification failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyAdminLogin = async (email, code) => {
    try {
      setLoading(true);
      const response = await API.post('/api/auth/verify-login', { email, code });
      const { user: userData, token: authToken } = response.data;
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Verification failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = () => {
    return user && token;
  };

  const value = {
    user,
    setUser,
    token,
    setToken,
    loading,
    login,
    register,
    verifyEmail,
    verifyAdminLogin,
    logout,
    isAuthenticated,
    unreadNotificationCount,
    setUnreadNotificationCount,
    clearUnreadNotifications
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
