import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCompass } from 'react-icons/fa';
import './AuthPages.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const { login, verifyAdminLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      if (result.requires_otp) {
        setShowOtp(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await verifyAdminLogin(formData.email, otp);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-sidebar">
          <div className="auth-sidebar-logo"><FaCompass style={{ fontSize: '1.8rem', color: '#ffffff' }} /></div>
          <h2 className="auth-sidebar-title">Smart Tourism</h2>
          <p className="auth-sidebar-subtitle">Welcome back to your ultimate travel companion.</p>
          <ul className="auth-sidebar-features">
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Resume Your Journey</li>
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Connect with Guides</li>
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Manage Bookings</li>
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Seamless Experience</li>
          </ul>
        </div>
        <div className="auth-main">
          <h1>Sign in to account</h1>
          <p>Enter your email and password to login</p>
          
          {error && <div className="error">{error}</div>}
        
        {showOtp ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '600' }}>
                Admin Verification Code
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                placeholder="Enter 6-digit code"
                required
                maxLength="6"
                autoComplete="one-time-code"
                inputMode="numeric"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}
                className="auth-input"
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                We've sent a 6-digit code to {formData.email}
              </p>
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-block" 
              style={{ marginTop: '10px' }}
              onClick={() => {
                setShowOtp(false);
                setOtp('');
                setError('');
              }}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <div 
                  className="input-icon-right" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          <p>Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Register here</Link></p>
        </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
