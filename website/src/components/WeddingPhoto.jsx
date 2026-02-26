import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import './WeddingPhoto.css';

const WeddingPhoto = ({ type = 'bride', className = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Photo paths (served from uploads/photos via nginx)
  const getPhotoPath = () => {
    switch (type) {
      case 'bride':
        return '/uploads/photos/bride/LIFE9617.jpg';
      case 'groom':
        return '/uploads/photos/groom/LIFE9911.jpg';
      default:
        return '/uploads/photos/couple/couple-main.jpg';
    }
  };

  // Preload the photo for this specific page when component mounts
  useEffect(() => {
    const photoPath = getPhotoPath();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = photoPath;
    document.head.appendChild(link);

    // Cleanup on unmount
    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [type]);

  const getAltText = () => {
    switch (type) {
      case 'bride':
        return t('photos.brideAlt', 'Beautiful bride photo');
      case 'groom':
        return t('photos.groomAlt', 'Handsome groom photo');
      case 'couple':
        return t('photos.coupleAlt', 'Beautiful couple photo');
      default:
        return t('photos.coupleAlt', 'Beautiful couple photo');
    }
  };

  const handleImageClick = () => {
    setOpen(true);
  };

  return (
    <>
      <div className={`wedding-photo-section ${className}`}>
        <div className="photo-container" onClick={handleImageClick}>
          <img 
            src={getPhotoPath()} 
            alt={getAltText()}
            className="wedding-photo"
            loading="eager"
            fetchpriority="high"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/uploads/photos/placeholder.svg';
            }}
          />
          <div className="photo-overlay">
            <div className="photo-caption">
              <h3>{t(`photos.${type}Caption`, `${type.charAt(0).toUpperCase() + type.slice(1)} Photo`)}</h3>
              <p>{t(`photos.${type}Description`, 'A beautiful moment captured')}</p>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: getPhotoPath(), alt: getAltText() }]}
      />
    </>
  );
};

export default WeddingPhoto;
