import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import './GalleryPage.css';

const GalleryPageSimple = () => {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample photos - Replace these with your actual wedding photos
  const photos = [
    { src: '/photos/photo1.jpg', alt: '婚礼照片 1' },
    { src: '/photos/photo2.jpg', alt: '婚礼照片 2' },
    { src: '/photos/photo3.jpg', alt: '婚礼照片 3' },
    { src: '/photos/photo4.jpg', alt: '婚礼照片 4' },
    { src: '/photos/photo5.jpg', alt: '婚礼照片 5' },
    { src: '/photos/photo6.jpg', alt: '婚礼照片 6' },
    { src: '/photos/photo7.jpg', alt: '婚礼照片 7' },
    { src: '/photos/photo8.jpg', alt: '婚礼照片 8' },
    { src: '/photos/photo9.jpg', alt: '婚礼照片 9' },
    { src: '/photos/photo10.jpg', alt: '婚礼照片 10' },
    { src: '/photos/photo11.jpg', alt: '婚礼照片 11' },
    { src: '/photos/photo12.jpg', alt: '婚礼照片 12' },
    { src: '/photos/photo13.jpg', alt: '婚礼照片 13' },
    { src: '/photos/photo14.jpg', alt: '婚礼照片 14' },
    { src: '/photos/photo15.jpg', alt: '婚礼照片 15' },
    { src: '/photos/photo16.jpg', alt: '婚礼照片 16' },
    { src: '/photos/photo17.jpg', alt: '婚礼照片 17' },
    { src: '/photos/photo18.jpg', alt: '婚礼照片 18' },
    { src: '/photos/photo19.jpg', alt: '婚礼照片 19' },
    { src: '/photos/photo20.jpg', alt: '婚礼照片 20' },
  ];

  const handleImageClick = (index) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  return (
    <div className="gallery-page">
      <div className="gallery-container">
        <div className="gallery-header">
          <h1 className="gallery-title">我们的婚礼回忆</h1>
          <p className="gallery-subtitle">庆祝爱情、欢笑和幸福永远</p>
        </div>

        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="photo-item"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/400x300/667eea/ffffff?text=Photo+${index + 1}`;
                }}
              />
              <div className="photo-overlay">
                <span className="view-icon">🔍</span>
                <span className="view-text">查看照片</span>
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

export default GalleryPageSimple;
