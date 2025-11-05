import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
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
  const imageRefs = useRef([]);

  // Wedding photos gallery - using your renamed photos
  const photos = [
    // All wedding photos from main photos directory (renamed to numbers)
    { src: '/photos/1.jpg', alt: 'Wedding Photo 1' },
    { src: '/photos/2.jpg', alt: 'Wedding Photo 2' },
    { src: '/photos/3.jpg', alt: 'Wedding Photo 3' },
    { src: '/photos/4.jpg', alt: 'Wedding Photo 4' },
    { src: '/photos/5.jpg', alt: 'Wedding Photo 5' },
    { src: '/photos/6.jpg', alt: 'Wedding Photo 6' },
    { src: '/photos/7.jpg', alt: 'Wedding Photo 7' },
    { src: '/photos/8.jpg', alt: 'Wedding Photo 8' },
    { src: '/photos/9.jpg', alt: 'Wedding Photo 9' },
    { src: '/photos/10.jpg', alt: 'Wedding Photo 10' },
    { src: '/photos/11.jpg', alt: 'Wedding Photo 11' },
    { src: '/photos/12.jpg', alt: 'Wedding Photo 12' },
    { src: '/photos/13.jpg', alt: 'Wedding Photo 13' },
    { src: '/photos/14.jpg', alt: 'Wedding Photo 14' },
    { src: '/photos/15.jpg', alt: 'Wedding Photo 15' },
    { src: '/photos/16.jpg', alt: 'Wedding Photo 16' },
    { src: '/photos/17.jpg', alt: 'Wedding Photo 17' },
    { src: '/photos/18.jpg', alt: 'Wedding Photo 18' },
  ];

  // Preload first few gallery images for faster initial load
  useEffect(() => {
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
    preloadImages(photos, 0, 6);

    // Preload remaining images after a short delay
    if (photos.length > 6) {
      setTimeout(() => {
        preloadImages(photos, 6);
      }, 500);
    }
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
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
  }, []);

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

        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div
              key={index}
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
                    e.target.src = `https://via.placeholder.com/400x300/667eea/ffffff?text=Photo+${index + 1}`;
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

        <Lightbox
          open={open}
          close={() => setOpen(false)}
          slides={photos}
          index={currentIndex}
        />
      </div>
    </div>
  );
};

export default GalleryPage;

