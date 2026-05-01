import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeService } from '../services';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    role: 'tourist',
    full_name: '',
    contact_number: '',
    covered_locations: ''
  });
  const [places, setPlaces] = useState([]);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');

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
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    const { full_name, contact_number, covered_locations, ...baseData } = formData;
    const result = await register(formData.email, formData.password, formData.role, {
        full_name,
        contact_number,
        covered_locations
    });
    
    if (result.success) {
      // Auto-login after registration
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
        <h1>Create Account</h1>
        <p>Join us to explore amazing travel destinations</p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
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

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
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
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  marginBottom: '12px',
                  fontSize: '0.95rem'
                }}
              />
              <div className="location-checkbox-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '10px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginTop: '5px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {filteredPlaces.length > 0 ? filteredPlaces.map(place => (
                  <label key={place.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.covered_locations.split(', ').includes(place.name)}
                      onChange={() => handleLocationToggle(place.name)}
                    />
                    {place.name}
                  </label>
                )) : (
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    No matching places found.
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.covered_locations.split(', ').includes('Island Wide')}
                    onChange={() => handleLocationToggle('Island Wide')}
                  />
                  Island Wide
                </label>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Selected: {formData.covered_locations || 'None'}
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="role">I am a:</label>
            <select 
              id="role" 
              name="role" 
              value={formData.role}
              onChange={handleChange}
            >
              <option value="tourist">Tourist</option>
              <option value="guide">Travel Guide</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
