import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './BackgroundMusic.css';

const BackgroundMusic = forwardRef((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
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

  // Listen for global enable-music event from envelope intros
  useEffect(() => {
    const handler = () => {
      const audio = document.getElementById('background-music');
      if (!audio) return;
      audio.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        setHasUserInteracted(true);
        console.log('[Music] Started via enable-music event');
      }).catch(err => {
        console.log('[Music] Failed to start via event:', err && (err.name + ':' + err.message));
      });
    };
    document.addEventListener('enable-music', handler);
    return () => document.removeEventListener('enable-music', handler);
  }, []);

  // Auto-start music on any direct user interaction (pointerdown/keydown/wheel/touchmove)
  useEffect(() => {
    if (hasUserInteracted || isPlaying) return;

    let started = false;

    const startMusic = () => {
      if (started) return;
      started = true;
      
      const audio = document.getElementById('background-music');
      if (!audio || !audio.paused) return;
      
      audio.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        setHasUserInteracted(true);
        console.log('[Music] Started automatically on user interaction');
      }).catch(err => {
        console.log('[Music] Failed to start:', err && (err.name + ':' + err.message));
        started = false; // Allow retry on failure
      });
    };

    // Use capture-phase immediate events to ensure play() is in the same activation frame
    const handlePointerDown = () => startMusic();
    const handleKeyDown = () => startMusic();
    const handleWheel = () => startMusic();
    const handleTouchMove = () => startMusic();

    document.addEventListener('pointerdown', handlePointerDown, { once: true, capture: true });
    document.addEventListener('keydown', handleKeyDown, { once: true, capture: true });
    document.addEventListener('wheel', handleWheel, { once: true, passive: true });
    document.addEventListener('touchmove', handleTouchMove, { once: true, passive: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('wheel', handleWheel, { passive: true });
      document.removeEventListener('touchmove', handleTouchMove, { passive: true });
    };
  }, [hasUserInteracted, isPlaying]);

  const togglePlay = () => {
    setHasUserInteracted(true);
    const audio = document.getElementById('background-music');
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Try to play the audio
        audio.play().then(() => {
          setIsPlaying(true);
          // Once user interacts, we can unmute if it was muted
          if (audio.muted && isMuted) {
            audio.muted = false;
            setIsMuted(false);
          }
        }).catch(error => {
          console.log('[Music] Audio play failed (user click):', error && (error.name + ':' + error.message));
          // If audio files don't exist, create a simple test tone
          createTestTone();
        });
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
      // If unmuting, make sure audio is playing first
      if (isMuted && audio.paused) {
        audio.play().then(() => {
          audio.muted = false;
          setIsMuted(false);
          setIsPlaying(true);
        }).catch(() => {
          // If play fails, at least try to unmute
          audio.muted = false;
          setIsMuted(false);
        });
      } else {
        audio.muted = !isMuted;
        setIsMuted(!isMuted);
      }
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
          playsInline
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
          className={`music-btn mute-btn ${isMuted ? 'muted' : ''} ${isMuted && !hasUserInteracted ? 'needs-unmute' : ''}`}
          onClick={toggleMute}
          title={isMuted ? (hasUserInteracted ? 'Unmute' : 'Click to unmute and hear music') : 'Mute'}
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
