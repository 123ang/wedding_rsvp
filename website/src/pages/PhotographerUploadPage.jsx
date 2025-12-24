import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminAuth, adminLogout } from '../services/api';
import { API_BASE_URL } from '../config/api';
import './PhotographerUploadPage.css';

const PhotographerUploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // {index: {progress: 0-100, status: 'uploading'|'success'|'error'}}
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [category, setCategory] = useState('pre-wedding'); // Default category
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manage'
  const [myPhotos, setMyPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Check authentication
  const auth = checkAdminAuth();
  if (!auth.success || auth.role !== 'photographer') {
    navigate('/admin/login');
    return null;
  }

  // Fetch photographer's photos
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchMyPhotos();
    }
  }, [activeTab]);

  const fetchMyPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const adminEmail = localStorage.getItem('admin_email');
      const adminId = localStorage.getItem('admin_id');
      
      // Fetch from photographer_photo table endpoint
      const response = await fetch(`${API_BASE_URL}/photos/photographer?limit=1000`, {
        headers: {
          'x-admin-email': adminEmail,
          'x-admin-id': adminId
        }
      });
      const data = await response.json();
      
      if (data.success && data.photos) {
        // Filter photos uploaded by this photographer (by photographer_email)
        const photographerPhotos = data.photos.filter(photo => 
          photo.photographer_email === auth.email
        );
        console.log('Fetched photos:', data.photos.length, 'Filtered:', photographerPhotos.length, 'Auth email:', auth.email);
        setMyPhotos(photographerPhotos);
      } else {
        console.log('No photos found or API error:', data);
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }

    // No limit - unlimited uploads
    setSelectedFiles(prev => [...prev, ...imageFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // Also clear progress for removed file
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    // Initialize progress for all files
    const initialProgress = {};
    selectedFiles.forEach((_, index) => {
      initialProgress[index] = { progress: 0, status: 'uploading' };
    });
    setUploadProgress(initialProgress);

    const adminEmail = localStorage.getItem('admin_email');
    const adminId = localStorage.getItem('admin_id');
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload files sequentially (1 by 1)
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        
        try {
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('user_name', auth.email);
          formData.append('category', category);

          // Create XMLHttpRequest for progress tracking
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(prev => ({
                  ...prev,
                  [index]: { progress, status: 'uploading' }
                }));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                  setUploadProgress(prev => ({
                    ...prev,
                    [index]: { progress: 100, status: 'success' }
                  }));
                  successCount++;
                  resolve(data);
                } else {
                  throw new Error(data.message || 'Upload failed');
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Network error'));
            });

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload aborted'));
            });

            xhr.open('POST', `${API_BASE_URL}/photos/upload`);
            xhr.setRequestHeader('x-admin-email', adminEmail);
            xhr.setRequestHeader('x-admin-id', adminId);
            xhr.send(formData);
          });
        } catch (err) {
          console.error(`Error uploading file ${index + 1}:`, err);
          setUploadProgress(prev => ({
            ...prev,
            [index]: { progress: 0, status: 'error' }
          }));
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccess(`Successfully uploaded ${successCount} photo(s)!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
        // Refresh photo list if on manage tab
        if (activeTab === 'manage') {
          fetchMyPhotos();
        }
      } else {
        setError('All uploads failed. Please try again.');
      }

      // Clear selected files and reset after a delay
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (success) {
          setSuccess('');
        }
      }, 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const adminEmail = localStorage.getItem('admin_email');
      const adminId = localStorage.getItem('admin_id');

      const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
          'x-admin-id': adminId
        },
        body: JSON.stringify({ user_phone: null }) // Photographers don't need user_phone
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Photo deleted successfully');
        fetchMyPhotos(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete photo');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete photo. Please try again.');
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="photographer-upload-page">
      <div className="photographer-header">
        <div>
          <h1>📸 Photographer Portal</h1>
          <p className="photographer-email">Logged in as: {auth.email}</p>
        </div>
        <button onClick={handleLogout} className="photographer-logout-btn">
          Logout
        </button>
      </div>

      {error && <div className="photographer-error">{error}</div>}
      {success && <div className="photographer-success">{success}</div>}

      {/* Tabs */}
      <div className="photographer-tabs">
        <button
          className={`photographer-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload Photos
        </button>
        <button
          className={`photographer-tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          🖼️ Manage Photos
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="photographer-upload-container">
          <div className="upload-section">
            <h2>Select Photos (Unlimited)</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="file-input"
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="select-files-btn"
              disabled={uploading}
            >
              📁 Choose Photos
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <>
              <div className="category-section">
                <label htmlFor="category">Category:</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="category-select"
                  disabled={uploading}
                >
                  <option value="pre-wedding">Pre-Wedding</option>
                  <option value="brides-dinner">Bride's Dinner</option>
                  <option value="morning-wedding">Morning Wedding</option>
                  <option value="grooms-dinner">Groom's Dinner</option>
                </select>
              </div>

              <div className="selected-files-section">
                <h3>Selected Photos ({selectedFiles.length})</h3>
                <div className="files-grid">
                  {selectedFiles.map((file, index) => {
                    const progress = uploadProgress[index] || { progress: 0, status: 'pending' };
                    return (
                      <div key={index} className="file-preview">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="preview-image"
                        />
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        {progress.status === 'uploading' && (
                          <div className="upload-progress-container">
                            <div className="upload-progress-bar">
                              <div 
                                className="upload-progress-fill"
                                style={{ width: `${progress.progress}%` }}
                              ></div>
                            </div>
                            <span className="upload-progress-text">{progress.progress}%</span>
                          </div>
                        )}
                        
                        {progress.status === 'success' && (
                          <div className="upload-status success">✓ Uploaded</div>
                        )}
                        
                        {progress.status === 'error' && (
                          <div className="upload-status error">✕ Failed</div>
                        )}
                        
                        {!uploading && progress.status === 'pending' && (
                          <button
                            onClick={() => removeFile(index)}
                            className="remove-file-btn"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleUpload}
                className="upload-btn"
                disabled={uploading}
              >
                {uploading ? `⏳ Uploading... (${Object.values(uploadProgress).filter(p => p.status === 'success').length}/${selectedFiles.length})` : `📤 Upload ${selectedFiles.length} Photo(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="photographer-manage-container">
          <h2>My Photos ({myPhotos.length})</h2>
          {loadingPhotos ? (
            <div className="loading-photos">Loading photos...</div>
          ) : myPhotos.length === 0 ? (
            <div className="no-photos">No photos uploaded yet.</div>
          ) : (
            <div className="photos-grid">
              {myPhotos.map((photo) => (
                <div key={photo.id} className="photo-manage-item">
                  <img
                    src={photo.image_url.startsWith('http') 
                      ? photo.image_url 
                      : `${API_BASE_URL.replace('/api', '')}${photo.image_url}`}
                    alt={photo.caption || photo.category || 'Photo'}
                    className="photo-manage-image"
                  />
                  <div className="photo-manage-info">
                    {photo.category && <p className="photo-caption">Category: {photo.category}</p>}
                    {photo.caption && <p className="photo-caption">{photo.caption}</p>}
                    <p className="photo-date">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
                    className="delete-photo-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="photographer-info">
        <h3>Instructions</h3>
        <ul>
          <li>Upload photos (no limit)</li>
          <li>Photos are uploaded one at a time (sequential upload)</li>
          <li>Choose category: Pre-Wedding, Bride's Dinner, Morning Wedding, or Groom's Dinner</li>
          <li>Supported formats: JPG, PNG, GIF, WebP</li>
          <li>Maximum file size: 1GB per photo</li>
          <li>Photos will appear in the wedding photo gallery according to their category</li>
          <li>You can delete your uploaded photos from the "Manage Photos" tab</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotographerUploadPage;
