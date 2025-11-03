import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './BackgroundMusic.css';

const BackgroundMusic = forwardRef((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2); // Default volume at 20% for autoplay
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Sample romantic wedding music URLs (you can replace with your own music files)
  const musicSources = [
    // You can add your own music files to the public folder
    '/music/wedding_music.mp3', // Your actual music file
    '/music/wedding-music-1.mp3',
    '/music/wedding-music-2.mp3',
    '/music/romantic-piano.mp3'
  ];

  const [currentTrack, setCurrentTrack] = useState(0);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    pause: () => {
      const audio = document.getElementById('background-music');
      if (audio && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
        console.log('Background music paused externally');
      }
    },
    play: () => {
      const audio = document.getElementById('background-music');
      if (audio && audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
          console.log('Background music resumed externally');
        }).catch(error => {
          console.log('Could not resume background music:', error);
        });
      }
    },
    isPlaying: () => {
      const audio = document.getElementById('background-music');
      return audio && !audio.paused;
    }
  }));

  useEffect(() => {
    const audio = document.getElementById('background-music');
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Autoplay functionality - start muted to bypass browser restrictions
  useEffect(() => {
    const audio = document.getElementById('background-music');
    if (audio && !hasUserInteracted) {
      let unmuteTimer = null;
      let hasAttemptedAutoplay = false;
      
      // Start with audio muted to allow autoplay
      audio.muted = true;
      setIsMuted(true);
      
      // Function to attempt autoplay
      const attemptAutoplay = () => {
        if (hasAttemptedAutoplay && !audio.paused) return;
        if (!audio.paused) return; // Already playing
        
        // Only attempt if audio has some data loaded
        if (audio.readyState >= 1) {
          hasAttemptedAutoplay = true;
          audio.play().then(() => {
            setIsPlaying(true);
            console.log('Music autoplay started (muted)');
            
            // Unmute after a short delay
            unmuteTimer = setTimeout(() => {
              audio.muted = false;
              setIsMuted(false);
              console.log('Music unmuted');
            }, 100); // Unmute after 0.1 seconds
          }).catch(error => {
            console.log('Autoplay prevented by browser:', error);
            hasAttemptedAutoplay = false; // Allow retry
            // If even muted autoplay fails, keep it muted and wait for user interaction
          });
        }
      };
      
      // Try autoplay immediately
      if (audio.readyState >= 1) {
        attemptAutoplay();
      }
      
      // Try autoplay after short delay
      const autoplayTimer = setTimeout(() => {
        attemptAutoplay();
      }, 100); // 0.1 second delay
      
      // Also try when audio is ready
      const handleCanPlay = () => {
        if (!hasUserInteracted && audio.paused) {
          attemptAutoplay();
        }
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('loadeddata', handleCanPlay);
      audio.addEventListener('loadedmetadata', handleCanPlay);
      audio.addEventListener('canplaythrough', handleCanPlay);

      return () => {
        clearTimeout(autoplayTimer);
        if (unmuteTimer) {
          clearTimeout(unmuteTimer);
        }
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('loadeddata', handleCanPlay);
        audio.removeEventListener('loadedmetadata', handleCanPlay);
        audio.removeEventListener('canplaythrough', handleCanPlay);
      };
    }
  }, [hasUserInteracted]);

  const togglePlay = () => {
    setHasUserInteracted(true);
    const audio = document.getElementById('background-music');
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Try to play the audio
        audio.play().catch(error => {
          console.log('Audio play failed:', error);
          // If audio files don't exist, create a simple test tone
          createTestTone();
        });
        setIsPlaying(true);
      }
    }
  };

  // Create a simple test tone if no music files are available
  const createTestTone = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.1, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2);
    
    console.log('Playing test tone - add music files to /public/music/ folder');
  };

  const toggleMute = () => {
    setHasUserInteracted(true);
    const audio = document.getElementById('background-music');
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    setHasUserInteracted(true);
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = document.getElementById('background-music');
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const nextTrack = () => {
    setHasUserInteracted(true);
    const audio = document.getElementById('background-music');
    if (audio) {
      const nextIndex = (currentTrack + 1) % musicSources.length;
      setCurrentTrack(nextIndex);
      audio.src = musicSources[nextIndex];
      if (isPlaying) {
        audio.play();
      }
    }
  };

  const handleEnded = () => {
    // Auto-play next track when current one ends
    nextTrack();
  };

  return (
    <div className="background-music">
      <audio
        id="background-music"
        src={musicSources[currentTrack]}
        onEnded={handleEnded}
        loop={false}
        preload="auto"
      />
      
      <div className="music-controls">
        <button 
          className={`music-btn play-btn ${isPlaying ? 'playing' : ''} ${!hasUserInteracted ? 'autoplay' : ''}`}
          onClick={togglePlay}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button 
          className={`music-btn mute-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        
        <div className="volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            title="Volume Control"
          />
          <span className="volume-display">{Math.round(volume * 100)}%</span>
        </div>
        
        <button 
          className="music-btn next-btn"
          onClick={nextTrack}
          title="Next Track"
        >
          ⏭️
        </button>
      </div>
    </div>
  );
});

export default BackgroundMusic;
