import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import './ImageCropperModal.css';

const ImageCropperModal = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Error cropping image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cropper-modal-overlay">
      <div className="cropper-modal">
        <div className="cropper-header">
          <h2>Crop Profile Picture</h2>
          <button className="cropper-close" onClick={onCancel}>&times;</button>
        </div>
        <div className="cropper-body">
          <div className="cropper-container">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="cropper-controls">
            <label>Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="zoom-range"
            />
          </div>
        </div>
        <div className="cropper-footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Processing...' : 'Save Picture'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
