import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { API_BASE_URL } from '../config/api';
import './BackgroundMusic.css';

// Fallback when uploads/song is empty or API unavailable (public/music/)
const FALLBACK_SONGS = [
  '/music/wedding_music.mp3',
  '/music/wedding_music_2.mp3',
  '/music/wedding-music-1.mp3',
  '/music/wedding-music-2.mp3',
  '/music/romantic-piano.mp3',
  '/music/On-The-Shore.mp3',
  '/music/One-and-one.mp3',
  '/music/Sea-house.mp3',
  '/music/Seaside-Ale.mp3',
  '/music/Something-you-want.mp3',
  '/music/Summer-Kids.mp3',
  '/music/Summer-Nude-OST-Natsu-no-yoruni.mp3',
  '/music/Sunlight.mp3',
  '/music/Sunset-Beach.mp3',
  '/music/To-Be-Continued.mp3',
  '/music/Triangle-Love.mp3'
];

const BackgroundMusic = forwardRef((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [musicSources, setMusicSources] = useState(FALLBACK_SONGS);
  const [currentTrack, setCurrentTrack] = useState(0);

  // Load playlist from /uploads/song (GET /api/songs). Add new songs by uploading to that folder.
  useEffect(() => {
    fetch(`${API_BASE_URL}/songs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.songs && data.songs.length > 0) {
          setMusicSources(data.songs);
          setCurrentTrack(0);
        }
      })
      .catch(() => {});
  }, []);

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
      }).catch(() => {});
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
      }).catch(() => {
        // Music file missing or unsupported – fail silently (add public/music/wedding_music.mp3 to enable)
        started = false;
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
    
    // Add website/public/music/wedding_music.mp3 to enable background music
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
    if (musicSources.length === 0) return;
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
          src={musicSources.length > 0 ? musicSources[currentTrack] : undefined}
          loop={false}
          onEnded={handleEnded}
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
