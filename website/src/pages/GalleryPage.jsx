import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { API_BASE_URL } from '../config/api';
import './GalleryPage.css';

const GalleryPage = () => {
  // Disable sakura petals while on gallery
  useEffect(() => {
    document.body.classList.add('no-petals');
    return () => document.body.classList.remove('no-petals');
  }, []);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pre-wedding');
  const imageRefs = useRef([]);

  // Category mappings
  const categories = {
    'pre-wedding': ['pre-wedding', 'pre wedding', 'prewedding'],
    'brides-dinner': ['bride\'s dinner', 'brides dinner', 'bride dinner', 'bride-dinner'],
    'morning-wedding': ['morning wedding', 'morning-wedding', 'ceremony', 'wedding ceremony'],
    'grooms-dinner': ['groom\'s dinner', 'grooms dinner', 'groom dinner', 'groom-dinner']
  };

  // Fetch photos from photographer_photo table
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/photos/photographer?limit=1000`);
        const data = await response.json();
        
        if (data.success && data.photos) {
          // Transform API photos to gallery format
          const transformedPhotos = data.photos.map(photo => ({
            src: photo.image_url.startsWith('http') 
              ? photo.image_url 
              : `${API_BASE_URL.replace('/api', '')}${photo.image_url}`,
            alt: photo.caption || `Photo by ${photo.user_name}`,
            id: photo.id,
            caption: photo.caption,
            tags: photo.tags || [],
            user_name: photo.user_name,
            category: photo.category // Include category for reference
          }));
          setAllPhotos(transformedPhotos);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
        // Fallback to empty array on error
        setAllPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  // Filter photos by active tab category
  const getFilteredPhotos = () => {
    if (activeTab === 'all') {
      return allPhotos;
    }

    // Map active tab to category value in photographer_photo table
    const categoryMap = {
      'pre-wedding': 'pre-wedding',
      'brides-dinner': 'brides-dinner',
      'morning-wedding': 'morning-wedding',
      'grooms-dinner': 'grooms-dinner'
    };

    const targetCategory = categoryMap[activeTab];
    
    // Filter by category directly if available, otherwise fall back to tag matching
    return allPhotos.filter(photo => {
      if (photo.category) {
        return photo.category === targetCategory;
      }
      
      // Fallback to tag matching for backward compatibility
      const categoryKeywords = categories[activeTab] || [];
      const photoTags = (photo.tags || []).map(tag => 
        typeof tag === 'string' ? tag.toLowerCase() : tag.name?.toLowerCase()
      );
      
      return categoryKeywords.some(keyword => 
        photoTags.some(tag => tag.includes(keyword.toLowerCase()))
      );
    });
  };

  const filteredPhotos = getFilteredPhotos();

  // Preload first few gallery images for faster initial load
  useEffect(() => {
    if (filteredPhotos.length === 0) return;

    const preloadImages = (imagePaths, startIndex = 0, count = 6) => {
      const imagesToPreload = imagePaths.slice(startIndex, startIndex + count);
      imagesToPreload.forEach((photo) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = photo.src;
        document.head.appendChild(link);
        
        // Also preload using Image object for better caching
        const img = new Image();
        img.src = photo.src;
      });
    };

    // Preload first 6 images immediately
    preloadImages(filteredPhotos, 0, 6);

    // Preload remaining images after a short delay
    if (filteredPhotos.length > 6) {
      setTimeout(() => {
        preloadImages(filteredPhotos, 6);
      }, 500);
    }
  }, [filteredPhotos]);

  // Reset loaded images when tab changes
  useEffect(() => {
    setLoadedImages(new Set());
    setCurrentIndex(0);
    imageRefs.current = [];
  }, [activeTab]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (filteredPhotos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            setLoadedImages(prev => new Set([...prev, index]));
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    imageRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.dataset.index = index;
        observer.observe(ref);
      }
    });

    return () => observer.disconnect();
  }, [filteredPhotos]);

  const handleImageClick = (index) => {
    setCurrentIndex(index);
    setOpen(true);
  };

    return (
    <div className="gallery-page">
      <div className="gallery-container">
        <div className="gallery-header">
          <h1 className="gallery-title">{t('hero.galleryTitle')}</h1>
          <p className="gallery-subtitle">{t('hero.gallerySubtitle')}</p>
        </div>

        {/* Category Tabs */}
        <div className="gallery-tabs">
          <button
            className={`gallery-tab ${activeTab === 'pre-wedding' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre-wedding')}
          >
            Pre-Wedding
          </button>
          <button
            className={`gallery-tab ${activeTab === 'brides-dinner' ? 'active' : ''}`}
            onClick={() => setActiveTab('brides-dinner')}
          >
            Bride's Dinner
          </button>
          <button
            className={`gallery-tab ${activeTab === 'morning-wedding' ? 'active' : ''}`}
            onClick={() => setActiveTab('morning-wedding')}
          >
            Morning Wedding
          </button>
          <button
            className={`gallery-tab ${activeTab === 'grooms-dinner' ? 'active' : ''}`}
            onClick={() => setActiveTab('grooms-dinner')}
          >
            Groom's Dinner
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="gallery-loading">
            <div className="loading-spinner"></div>
            <p>Loading photos...</p>
          </div>
        )}

        {/* Photo Grid */}
        {!loading && filteredPhotos.length === 0 && (
          <div className="gallery-empty">
            <p>No photos found in this category yet.</p>
          </div>
        )}

        {!loading && filteredPhotos.length > 0 && (
          <div className="photo-grid">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id || index}
                className="photo-item"
                onClick={() => handleImageClick(index)}
                ref={(el) => (imageRefs.current[index] = el)}
              >
                {loadedImages.has(index) ? (
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/400x300/f472b6/ffffff?text=Photo+${index + 1}`;
                    }}
                  />
                ) : (
                  <div className="photo-placeholder">
                    <div className="loading-spinner"></div>
                  </div>
                )}
                <div className="photo-overlay">
                  <span className="view-icon">🔍</span>
                  <span className="view-text">{t('gallery.viewPhoto')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Lightbox
          open={open}
          close={() => setOpen(false)}
          slides={filteredPhotos}
          index={currentIndex}
        />
      </div>
    </div>
  );
};

export default GalleryPage;

