import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeService } from '../services';
import { FaCamera, FaMapPin, FaUpload, FaTimes, FaCheckCircle, FaIdCard, FaHistory, FaLanguage, FaUserTie, FaInfoCircle, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCompass } from 'react-icons/fa';
import ImageCropperModal from '../components/ImageCropperModal';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    role: 'tourist',
    full_name: '',
    contact_number: '',
    covered_locations: '',
    profile_image: null,
    experience_years: '',
    license_number: '',
    primary_language: '',
    other_languages: ''
  });
  const [places, setPlaces] = useState([]);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await placeService.getAllPlaces();
        setPlaces(response.data.data || []);
      } catch (err) {
        console.error('Error fetching places:', err);
      }
    };
    fetchPlaces();
  }, []);

  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(placeSearchTerm.toLowerCase()) ||
    (place.category || '').toLowerCase().includes(placeSearchTerm.toLowerCase())
  );

  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const { register, verifyEmail, login } = useAuth();
  const navigate = useNavigate();

  const handleLocationToggle = (locationName) => {
    let current = formData.covered_locations ? formData.covered_locations.split(', ') : [];
    // Clean up empty strings if any
    current = current.filter(l => l !== "");
    
    if (current.includes(locationName)) {
      current = current.filter(l => l !== locationName);
    } else {
      current.push(locationName);
    }
    setFormData(prev => ({ ...prev, covered_locations: current.join(', ') }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError('Image size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImageSrc(event.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBase64) => {
    setFormData(prev => ({ ...prev, profile_image: croppedImageBase64 }));
    setImagePreview(croppedImageBase64);
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    
    if (!strongPasswordRegex.test(formData.password)) {
      setPasswordError('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setLoading(true);
    
    const { full_name, contact_number, covered_locations, profile_image, experience_years, license_number, primary_language, other_languages } = formData;
    const result = await register(formData.email, formData.password, formData.role, {
        full_name,
        contact_number,
        covered_locations,
        profile_image_url: profile_image,
        experience_years,
        license_number,
        languages: primary_language + (other_languages ? `, ${other_languages}` : '')
    });
    
    if (result.success) {
      // Show OTP form instead of logging in automatically
      setShowOtp(true);
      setError('');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    const result = await verifyEmail(formData.email, otp);

    if (result.success) {
      // Auto-login after successful verification
      await login(formData.email, formData.password);
      navigate('/dashboard');
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
          <p className="auth-sidebar-subtitle">Explore the world with ease and expertise.</p>
          <ul className="auth-sidebar-features">
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Custom Itineraries</li>
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Local Expert Guides</li>
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Place Reviews</li>
            <li><div className="auth-feature-icon"><FaCheckCircle /></div> Secure Bookings</li>
          </ul>
        </div>
        <div className="auth-main">
          <h1>Create your account</h1>
          <p>Fill in your details to get started</p>
          
          {error && <div className="error">{error}</div>}
        
        {showOtp ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '600' }}>
                Verification Code
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
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email & Create Account'}
            </button>
            
            <button type="button" onClick={() => setShowOtp(false)} className="btn btn-outline btn-block" style={{ marginTop: '12px' }} disabled={loading}>
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label htmlFor="role" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                <FaUserTie style={{ color: 'var(--text-head)' }} /> I am a:
              </label>
              <select 
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ 
                  fontWeight: '700', 
                  border: '1px solid var(--primary)', 
                  background: 'var(--bg-page)', 
                  color: 'var(--text-body)',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  width: '100%',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="tourist">Tourist</option>
                <option value="guide">Travel Guide</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

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

            {(formData.role === 'guide' || formData.role === 'tourist') && (
              <div className="form-group">
                <label htmlFor="contact_number">Contact Number</label>
                <input
                  type="text"
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="e.g., +1234567890"
                  required
                />
              </div>
            )}

            {formData.role === 'guide' && (
              <div className="form-group">
                <label>Locations I can Guide (Multiple)</label>
                <input
                  type="text"
                  value={placeSearchTerm}
                  onChange={(e) => setPlaceSearchTerm(e.target.value)}
                  placeholder="Search places by name or category..."
                  className="auth-input"
                  style={{ marginBottom: '12px' }}
                />
                <div className="location-checkbox-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr', 
                  gap: '8px',
                  padding: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  marginTop: '5px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-page)'
                }}>
                  {filteredPlaces.length > 0 ? filteredPlaces.map(place => (
                    <label key={place.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      userSelect: 'none',
                      color: 'var(--text-body)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={formData.covered_locations.split(', ').includes(place.name)}
                        onChange={() => handleLocationToggle(place.name)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <span>{place.name}</span>
                    </label>
                  )) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px' }}>
                      No matching places found.
                    </div>
                  )}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    fontSize: '0.95rem', 
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                    color: 'var(--text-body)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={formData.covered_locations.split(', ').includes('Island Wide')}
                      onChange={() => handleLocationToggle('Island Wide')}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span>Island Wide</span>
                  </label>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                    <FaMapPin style={{ color: 'var(--text-head)' }} /> Selected Locations
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.covered_locations ? formData.covered_locations.split(', ').filter(l => l).map(loc => (
                      <span 
                        key={loc} 
                        style={{ 
                          background: 'var(--primary)', 
                          color: 'white', 
                          padding: '6px 12px', 
                          borderRadius: '999px', 
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {loc}
                        <FaTimes 
                          style={{ cursor: 'pointer', fontSize: '0.7rem', opacity: '0.8' }} 
                          onClick={() => handleLocationToggle(loc)}
                          onMouseEnter={(e) => e.target.style.opacity = '1'}
                          onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                        />
                      </span>
                    )) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>None selected yet</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Professional Details Section */}
            {formData.role === 'guide' && (
              <div className="professional-details-section" style={{ 
                backgroundColor: 'rgba(79, 70, 229, 0.03)', 
                padding: '24px', 
                borderRadius: '16px', 
                border: '1px solid var(--border)',
                marginTop: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-head)' }}>
                  <FaUserTie style={{ color: 'var(--text-head)' }} /> Professional Qualifications
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '600', marginBottom: '8px' }}>
                      <FaIdCard style={{ color: 'var(--text-head)' }} /> License Number
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      placeholder="e.g., LKR-9921"
                      className="auth-input"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Leave blank if not yet licensed</p>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '600', marginBottom: '8px' }}>
                      <FaHistory style={{ color: 'var(--text-head)' }} /> Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '600', marginBottom: '8px' }}>
                      <FaLanguage style={{ color: 'var(--text-head)' }} /> Primary Language
                    </label>
                    <select 
                      name="primary_language" 
                      value={formData.primary_language} 
                      onChange={handleChange}
                      className="auth-input"
                      style={{ width: '100%', height: '52px', background: 'var(--bg-page)', color: 'var(--text-body)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 16px' }}
                    >
                      <option value="">Select Primary</option>
                      <option value="English">English</option>
                      <option value="Sinhala">Sinhala</option>
                      <option value="Tamil">Tamil</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-head)', fontWeight: '600', marginBottom: '8px' }}>
                       <FaLanguage style={{ color: 'var(--text-head)' }} /> Other Languages
                    </label>
                    <input
                      type="text"
                      name="other_languages"
                      value={formData.other_languages}
                      onChange={handleChange}
                      placeholder="e.g. Japanese, Italian"
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
                <label style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-head)' }}>
                  <FaCamera style={{ color: 'var(--primary)' }} /> Profile Picture
                </label>
                {imagePreview && (
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    display: 'inline-block'
                  }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        width: '160px', 
                        height: '160px', 
                        objectFit: 'cover',
                        flexShrink: 0,
                        borderRadius: '12px',
                        display: 'block',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                )}
                <div style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '100%'
                }}>
                  <input
                    type="file"
                    id="profile_image"
                    name="profile_image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{
                      display: 'none'
                    }}
                  />
                  <label
                    htmlFor="profile_image"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '24px 20px',
                      borderRadius: '12px',
                      border: '2px dashed var(--primary)',
                      backgroundColor: 'rgba(79, 70, 229, 0.05)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: 'var(--text-head)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--primary-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaUpload style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '4px' }} />
                    Click to upload or drag and drop
                  </label>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '8px' }}>
                  Supported formats: JPG, PNG, WebP (Max 1MB)
                </p>
              </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Password
                <FaInfoCircle 
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem' }} 
                  onClick={() => setShowPasswordInfo(!showPasswordInfo)}
                  title="Click for password requirements"
                />
              </label>
              
              {showPasswordInfo && (
                <div style={{
                  backgroundColor: 'rgba(79, 70, 229, 0.05)',
                  border: '1px solid var(--primary)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '0.85rem',
                  color: 'var(--text-body)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--primary)' }}>Password Requirements:</strong>
                  <ul style={{ paddingLeft: '20px', margin: '0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>At least <strong>8 characters</strong> long</li>
                    <li>One <strong>uppercase</strong> letter (A-Z)</li>
                    <li>One <strong>lowercase</strong> letter (a-z)</li>
                    <li>One <strong>number</strong> (0-9)</li>
                    <li>One <strong>special character</strong> (@, $, !, %, *, ?, &)</li>
                  </ul>
                </div>
              )}

              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => { handleChange(e); setPasswordError(''); }}
                  placeholder="Strong password required"
                  required
                  style={passwordError ? { border: '1px solid var(--danger, #ef4444)', background: 'rgba(239, 68, 68, 0.05)' } : {}}
                />
                <div 
                  className="input-icon-right" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              
              {passwordError && (
                <div style={{
                  color: 'var(--danger, #ef4444)',
                  fontSize: '0.85rem',
                  marginTop: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '6px'
                }}>
                  <FaTimes /> {passwordError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => { handleChange(e); setPasswordError(''); }}
                  placeholder="Re-enter your password"
                  required
                  style={passwordError === 'Passwords do not match.' ? { border: '1px solid var(--danger, #ef4444)', background: 'rgba(239, 68, 68, 0.05)' } : {}}
                />
                <div 
                  className="input-icon-right" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending Code...' : 'Register'}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link></p>
        </div>
        </div>
      </div>


      {showCropper && tempImageSrc && (
        <ImageCropperModal
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setTempImageSrc(null);
          }}
        />
      )}
    </main>
  );
};

export default RegisterPage;
