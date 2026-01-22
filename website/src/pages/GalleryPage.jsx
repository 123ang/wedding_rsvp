import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import JSZip from 'jszip';
import { API_BASE_URL } from '../config/api';
import './GalleryPage.css';

const PHOTOS_PER_PAGE = 30;
const CACHE_NAME = 'gallery-images-cache-v1';
const SLIDESHOW_INTERVAL = 2500; // 2.5 seconds

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
  const [displayedPhotos, setDisplayedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pre-wedding');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [allPhotosForSlideshow, setAllPhotosForSlideshow] = useState([]);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const slideshowIntervalRef = useRef(null);
  const imageRefs = useRef([]);
  const imageCache = useRef(new Map());

  // Category mappings
  const categories = {
    'pre-wedding': ['pre-wedding', 'pre wedding', 'prewedding'],
    'brides-dinner': ['bride\'s dinner', 'brides dinner', 'bride dinner', 'bride-dinner'],
    'morning-wedding': ['morning wedding', 'morning-wedding', 'ceremony', 'wedding ceremony'],
    'grooms-dinner': ['groom\'s dinner', 'grooms dinner', 'groom dinner', 'groom-dinner']
  };

  // Initialize Cache API
  useEffect(() => {
    const initCache = async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          console.log('Image cache initialized');
        }
      } catch (error) {
        console.error('Error initializing cache:', error);
      }
    };
    initCache();
  }, []);

  // Cache image function
  const cacheImage = useCallback(async (imageUrl) => {
    try {
      if ('caches' in window && !imageCache.current.has(imageUrl)) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(imageUrl);
        
        if (!cachedResponse) {
          const response = await fetch(imageUrl);
          if (response.ok) {
            await cache.put(imageUrl, response.clone());
            imageCache.current.set(imageUrl, true);
          }
        } else {
          imageCache.current.set(imageUrl, true);
        }
      }
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }, []);

  // Fetch cached image
  const getCachedImage = useCallback(async (imageUrl) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(imageUrl);
        if (cachedResponse) {
          return URL.createObjectURL(await cachedResponse.blob());
        }
      }
      return imageUrl;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return imageUrl;
    }
  }, []);

  // Fetch photos from photographer_photo table with pagination
  const fetchPhotos = useCallback(async (page = 1, category = null) => {
    try {
      setLoading(true);

      const limit = PHOTOS_PER_PAGE;
      let url = `${API_BASE_URL}/photos/photographer?limit=${limit}&page=${page}`;
      if (category) {
        url += `&category=${category}`;
      }

      const response = await fetch(url);
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
          category: photo.category
        }));

        // Replace photos (page-by-page pagination)
        setDisplayedPhotos(transformedPhotos);

        // Update pagination info
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalPhotos(data.pagination.total || 0);
        }

        // Cache images in background
        transformedPhotos.forEach(photo => {
          cacheImage(photo.src);
        });
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  }, [cacheImage]);

  // Fetch all photos for slideshow (only when slideshow is requested)
  const fetchAllPhotosForSlideshow = useCallback(async (category = null) => {
    try {
      let url = `${API_BASE_URL}/photos/photographer?limit=1000`;
      if (category) {
        url += `&category=${category}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.photos) {
        const transformedPhotos = data.photos.map(photo => ({
          src: photo.image_url.startsWith('http') 
            ? photo.image_url 
            : `${API_BASE_URL.replace('/api', '')}${photo.image_url}`,
          alt: photo.caption || `Photo by ${photo.user_name}`,
          id: photo.id,
          caption: photo.caption,
          tags: photo.tags || [],
          user_name: photo.user_name,
          category: photo.category
        }));
        setAllPhotosForSlideshow(transformedPhotos);
        return transformedPhotos;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all photos for slideshow:', error);
      return [];
    }
  }, []);

  // Initial fetch and fetch on tab/page change
  useEffect(() => {
    const categoryMap = {
      'pre-wedding': 'pre-wedding',
      'brides-dinner': 'brides-dinner',
      'morning-wedding': 'morning-wedding',
      'grooms-dinner': 'grooms-dinner'
    };
    const category = categoryMap[activeTab] || null;
    fetchPhotos(currentPage, category);
  }, [activeTab, currentPage, fetchPhotos]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setAllPhotosForSlideshow([]);
  }, [activeTab]);

  // Page navigation functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Get filtered photos (now just return displayedPhotos since API filters)
  const getFilteredPhotos = () => {
    return displayedPhotos;
  };

  // Download single photo
  const handleDownloadPhoto = async (e, photo, index) => {
    e.stopPropagation(); // Prevent opening lightbox
    
    try {
      const response = await fetch(photo.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use index
      const urlParts = photo.src.split('/');
      const filename = urlParts[urlParts.length - 1] || `photo-${index + 1}.jpg`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Failed to download photo. Please try again.');
    }
  };

  // Download all photos in current category as a zip file
  const handleDownloadAll = async () => {
    const currentPhotos = getFilteredPhotos();
    
    if (currentPhotos.length === 0) {
      alert('No photos to download');
      return;
    }

    setDownloadingZip(true);
    
    try {
      // Fetch ALL photos in the category (not just current page)
      const categoryMap = {
        'pre-wedding': 'pre-wedding',
        'brides-dinner': 'brides-dinner',
        'morning-wedding': 'morning-wedding',
        'grooms-dinner': 'grooms-dinner'
      };
      const category = categoryMap[activeTab] || null;
      
      // Fetch all photos for this category
      const allCategoryPhotos = await fetchAllPhotosForSlideshow(category);
      
      if (allCategoryPhotos.length === 0) {
        alert('No photos found to download');
        setDownloadingZip(false);
        return;
      }

      if (!window.confirm(`Download all ${allCategoryPhotos.length} photos in ${activeTab} category as a zip file? This may take a while.`)) {
        setDownloadingZip(false);
        return;
      }

      const zip = new JSZip();
      const categoryName = activeTab.replace('-', '_');
      const zipFileName = `${categoryName}_photos_${new Date().toISOString().split('T')[0]}.zip`;
      
      // Fetch all photos and add to zip
      for (let i = 0; i < allCategoryPhotos.length; i++) {
        const photo = allCategoryPhotos[i];
        try {
          const response = await fetch(photo.src);
          if (!response.ok) {
            console.warn(`Failed to fetch photo ${i + 1}: ${photo.src}`);
            continue;
          }
          
          const blob = await response.blob();
          
          // Extract filename from URL or use index
          const urlParts = photo.src.split('/');
          let filename = urlParts[urlParts.length - 1] || `photo-${i + 1}.jpg`;
          
          // Ensure filename has extension
          if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const contentType = blob.type;
            const extension = contentType.includes('png') ? 'png' : 
                            contentType.includes('gif') ? 'gif' : 
                            contentType.includes('webp') ? 'webp' : 'jpg';
            filename = `photo-${i + 1}.${extension}`;
          }
          
          // Add to zip with a clean filename
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Error processing photo ${i + 1}:`, error);
          // Continue with other photos even if one fails
        }
      }
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download the zip file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`Successfully downloaded ${allCategoryPhotos.length} photos as ${zipFileName}!`);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try again.');
    } finally {
      setDownloadingZip(false);
    }
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

  // Slideshow functions
  const startSlideshow = async () => {
    // Fetch all photos for slideshow if not already loaded
    let slideshowPhotos = allPhotosForSlideshow;
    
    if (slideshowPhotos.length === 0) {
      const categoryMap = {
        'pre-wedding': 'pre-wedding',
        'brides-dinner': 'brides-dinner',
        'morning-wedding': 'morning-wedding',
        'grooms-dinner': 'grooms-dinner'
      };
      const category = categoryMap[activeTab] || null;
      slideshowPhotos = await fetchAllPhotosForSlideshow(category);
    }

    if (slideshowPhotos.length === 0) return;

    setSlideshowActive(true);
    setSlideshowIndex(0);
    setCurrentIndex(0);
    setOpen(true);

    // Request fullscreen
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    }

    // Start auto-advance
    slideshowIntervalRef.current = setInterval(() => {
      setSlideshowIndex(prev => {
        const nextIndex = (prev + 1) % slideshowPhotos.length;
        setCurrentIndex(nextIndex);
        return nextIndex;
      });
    }, SLIDESHOW_INTERVAL);
  };

  const stopSlideshow = () => {
    setSlideshowActive(false);
    if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current);
      slideshowIntervalRef.current = null;
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && slideshowActive) {
        stopSlideshow();
        setOpen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [slideshowActive]);

  // Cleanup slideshow on unmount
  useEffect(() => {
    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
      }
    };
  }, []);

  // Stop slideshow when lightbox closes
  useEffect(() => {
    if (!open && slideshowActive) {
      setSlideshowActive(false);
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
        slideshowIntervalRef.current = null;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [open, slideshowActive]);

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
        <div className="gallery-tabs-container">
          <div className="gallery-tabs">
            <button
              className={`gallery-tab ${activeTab === 'pre-wedding' ? 'active' : ''}`}
              onClick={() => setActiveTab('pre-wedding')}
            >
              {t('gallery.categories.preWedding')}
            </button>
            <button
              className={`gallery-tab ${activeTab === 'brides-dinner' ? 'active' : ''}`}
              onClick={() => setActiveTab('brides-dinner')}
            >
              {t('gallery.categories.bridesDinner')}
            </button>
            <button
              className={`gallery-tab ${activeTab === 'morning-wedding' ? 'active' : ''}`}
              onClick={() => setActiveTab('morning-wedding')}
            >
              {t('gallery.categories.morningWedding')}
            </button>
            <button
              className={`gallery-tab ${activeTab === 'grooms-dinner' ? 'active' : ''}`}
              onClick={() => setActiveTab('grooms-dinner')}
            >
              {t('gallery.categories.groomsDinner')}
            </button>
          </div>
          {!loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={startSlideshow}
                className="slideshow-btn"
                title="Start Fullscreen Slideshow"
                disabled={filteredPhotos.length === 0}
              >
                ▶️ {t('gallery.slideshow')}
              </button>
              <button
                onClick={handleDownloadAll}
                className={`download-all-btn ${filteredPhotos.length === 0 || downloadingZip ? 'disabled' : ''}`}
                title={filteredPhotos.length === 0 ? t('gallery.noPhotosToDownload') : downloadingZip ? t('gallery.creatingZip') : t('gallery.downloadAllTitle', { count: totalPhotos })}
                disabled={filteredPhotos.length === 0 || downloadingZip}
              >
                {downloadingZip ? `⏳ ${t('gallery.creatingZip')}` : `⬇️ ${t('gallery.downloadAll')} (${totalPhotos} ${t('gallery.photos')})`}
              </button>
            </div>
          )}
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
                <button
                  className="photo-download-btn"
                  onClick={(e) => handleDownloadPhoto(e, photo, index)}
                  title="Download Photo"
                >
                  ⬇️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredPhotos.length > 0 && totalPages > 1 && (
          <div className="pagination-container">
            <button
              onClick={goToPrevPage}
              className="pagination-btn"
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            
            <div className="pagination-info">
              <span className="pagination-text">
                Page {currentPage} of {totalPages} ({totalPhotos} photos)
              </span>
              {totalPages <= 10 && (
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={goToNextPage}
              className="pagination-btn"
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}

        <Lightbox
          open={open}
          close={() => {
            setOpen(false);
            if (slideshowActive) {
              stopSlideshow();
            }
          }}
          slides={slideshowActive && allPhotosForSlideshow.length > 0 ? allPhotosForSlideshow : filteredPhotos}
          index={currentIndex}
          on={{
            view: ({ index }) => {
              setCurrentIndex(index);
              if (slideshowActive) {
                setSlideshowIndex(index);
              }
            }
          }}
        />
        
        {/* Slideshow Controls Overlay */}
        {slideshowActive && open && (
          <div className="slideshow-controls">
            <button onClick={stopSlideshow} className="slideshow-stop-btn">
              ⏹ {t('gallery.stopSlideshow')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;

