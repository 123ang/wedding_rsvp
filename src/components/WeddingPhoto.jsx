import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import './WeddingPhoto.css';

const WeddingPhoto = ({ type = 'bride', className = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Photo paths based on type
  const getPhotoPath = () => {
    switch (type) {
      case 'bride':
        return '/photos/bride/LIFE9617.jpg';
      case 'groom':
        return '/photos/groom/LIFE9911.jpg';
      
      default:
        return '/photos/couple/couple-main.jpg';
    }
  };

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
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3MCAxMjBIMjMwTDIwMCAxNTBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iMjAiIGZpbGw9IiNDQ0NDQ0MiLz4KPHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3MCAxMjBIMjMwTDIwMCAxNTBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iMjAiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+';
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
