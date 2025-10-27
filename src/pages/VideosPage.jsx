import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import audioManager from '../utils/audioManager';
import './VideosPage.css';

const VideosPage = () => {
  const { t } = useTranslation();
  const iframeRef = useRef(null);

  const videos = [
    {
      id: 1,
      title: t('videos.mainVideo.title'),
      description: t('videos.mainVideo.description'),
      youtubeId: 'AYH5zh5h7yo', // Extracted from the YouTube URL
      thumbnail: 'https://img.youtube.com/vi/AYH5zh5h7yo/maxresdefault.jpg'
    }
  ];

  // Function to pause background music
  const pauseBackgroundMusic = () => {
    audioManager.pauseForVideo();
  };

  // Function to resume background music
  const resumeBackgroundMusic = () => {
    audioManager.resumeAfterVideo();
  };

  // Listen for YouTube player events and iframe interactions
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if message is from YouTube
      if (event.origin !== 'https://www.youtube.com') return;

      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case 'video-progress':
          case 'video-play':
            // Video is playing
            pauseBackgroundMusic();
            break;
          case 'video-pause':
            // Video is paused
            resumeBackgroundMusic();
            break;
          case 'video-end':
            // Video ended
            resumeBackgroundMusic();
            break;
          default:
            break;
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    // Monitor iframe focus and visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause music
        audioManager.forcePause();
      } else {
        // Page is visible, check if we should resume
        if (!audioManager.isVideoPlaying()) {
          audioManager.forceResume();
        }
      }
    };

    // Monitor iframe clicks and interactions
    const handleIframeInteraction = () => {
      pauseBackgroundMusic();
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add click listeners to iframe
    if (iframeRef.current) {
      iframeRef.current.addEventListener('click', handleIframeInteraction);
      iframeRef.current.addEventListener('focus', handleIframeInteraction);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('click', handleIframeInteraction);
        iframeRef.current.removeEventListener('focus', handleIframeInteraction);
      }
    };
  }, []);

  // Handle iframe load and focus events
  const handleIframeLoad = () => {
    // Pause background music when iframe loads (video might start)
    pauseBackgroundMusic();
  };

  const handleIframeClick = () => {
    // Pause background music when user interacts with video
    pauseBackgroundMusic();
  };

  // Add a simple timer-based detection for video interaction
  useEffect(() => {
    let interactionTimer;
    
    const handleMouseMove = () => {
      // If user moves mouse over video area, assume they might play video
      clearTimeout(interactionTimer);
      interactionTimer = setTimeout(() => {
        pauseBackgroundMusic();
      }, 1000); // Pause music after 1 second of mouse activity
    };

    const handleMouseLeave = () => {
      // When mouse leaves video area, resume music after a delay
      clearTimeout(interactionTimer);
      interactionTimer = setTimeout(() => {
        resumeBackgroundMusic();
      }, 3000); // Resume music after 3 seconds of no activity
    };

    // Add mouse event listeners to the video container
    const videoContainer = document.querySelector('.video-wrapper');
    if (videoContainer) {
      videoContainer.addEventListener('mouseenter', handleMouseMove);
      videoContainer.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearTimeout(interactionTimer);
      if (videoContainer) {
        videoContainer.removeEventListener('mouseenter', handleMouseMove);
        videoContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="videos-page">
      <div className="videos-container">
        <div className="videos-header">
          <h1 className="videos-title">{t('videos.title')}</h1>
          <p className="videos-subtitle">{t('videos.subtitle')}</p>
          <div className="audio-notice">
            <p className="audio-notice-text">
              🎵 {t('videos.audioNotice')}
            </p>
          </div>
        </div>
        
        <div className="videos-grid">
          {videos.map((video) => (
            <div key={video.id} className="video-item">
              <div className="video-wrapper">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={handleIframeLoad}
                  onClick={handleIframeClick}
                ></iframe>
              </div>
              <div className="video-info">
                <h3 className="video-title">{video.title}</h3>
                <p className="video-description">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideosPage;
