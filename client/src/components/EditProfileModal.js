import React, { useState, useEffect } from 'react';
import { FaCamera, FaTrash, FaUserTie } from 'react-icons/fa';
import ImageCropperModal from './ImageCropperModal';
import './EditProfileModal.css';

const EditProfileModal = ({ user, initialData, currentImageUrl, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  useEffect(() => {
    setFormData(initialData || {});
    setImagePreview(currentImageUrl || '');
    setProfileImage(null); // No new image yet
  }, [initialData, currentImageUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Image size must be less than 1MB');
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
    setProfileImage(croppedImageBase64);
    setImagePreview(croppedImageBase64);
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleRemoveImage = () => {
    setProfileImage('');
    setImagePreview('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // We pass back the formData, plus the specific image to save.
    // If profileImage is an empty string, it means the user explicitly removed it.
    // If profileImage is null, it means the user didn't change it (so keep currentImageUrl).
    // If profileImage has data, use that.
    
    let finalImageUrl = currentImageUrl;
    if (profileImage !== null) {
      finalImageUrl = profileImage; // could be '' (removed) or base64 (new)
    }

    onSave(formData, finalImageUrl);
  };

  return (
    <>
      <div className="edit-modal-overlay" onClick={onClose}>
        <div className="edit-modal" onClick={e => e.stopPropagation()}>
          <div className="edit-modal-header">
            <h2>Edit Profile</h2>
            <button className="edit-modal-close" onClick={onClose}>&times;</button>
          </div>
          
          <form className="edit-modal-body" onSubmit={handleSubmit}>
            {/* Profile Picture Section */}
            <div className="edit-modal-avatar-section">
              <div className="avatar-preview-container">
                <div className="avatar-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      <FaUserTie />
                    </div>
                  )}
                </div>
                
                <div className="avatar-actions">
                  <label htmlFor="modal-profile-image" className="btn btn-primary avatar-btn" style={{ cursor: 'pointer', margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCamera /> Upload New
                  </label>
                  <input
                    type="file"
                    id="modal-profile-image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {imagePreview && (
                    <button type="button" onClick={handleRemoveImage} className="btn btn-outline avatar-btn" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#ef4444' }}>
                      <FaTrash /> Remove
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  Max file size: 1MB (JPG, PNG, WebP)
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>{user?.role === 'guide' ? 'Covered Locations' : 'Location'}</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                placeholder={user?.role === 'guide' ? "e.g. Kandy, Colombo, Galle" : "e.g. New York, USA"}
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number || ''}
                onChange={handleInputChange}
                placeholder="e.g. +123456789"
              />
            </div>

            {user?.role === 'guide' && (
              <>
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. History, Nature, Adventure"
                  />
                </div>
                
                <div className="form-group" style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Experience (Years)</label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Hourly Rate ($)</label>
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Languages</label>
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. English, French, Spanish"
                  />
                </div>
              </>
            )}

            <div className="edit-modal-footer">
              <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '10px 24px', fontWeight: '700' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>Save Changes</button>
            </div>
          </form>
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
    </>
  );
};

export default EditProfileModal;
