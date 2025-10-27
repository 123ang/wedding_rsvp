// Global Audio Manager for handling conflicts between background music and video players
class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.videoPlaying = false;
    this.musicWasPlaying = false;
    this.listeners = [];
  }

  // Initialize the audio manager
  init() {
    this.backgroundMusic = document.getElementById('background-music');
    console.log('Audio Manager initialized');
  }

  // Register a listener for audio state changes
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Notify all listeners of state changes
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(event, data);
      }
    });
  }

  // Pause background music when video starts
  pauseForVideo() {
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
      this.musicWasPlaying = true;
      this.videoPlaying = true;
      console.log('Background music paused for video');
      this.notifyListeners('musicPaused', { reason: 'video' });
    }
  }

  // Resume background music when video stops
  resumeAfterVideo() {
    if (this.backgroundMusic && this.backgroundMusic.paused && this.musicWasPlaying) {
      this.backgroundMusic.play().then(() => {
        this.musicWasPlaying = false;
        this.videoPlaying = false;
        console.log('Background music resumed after video');
        this.notifyListeners('musicResumed', { reason: 'video' });
      }).catch(error => {
        console.log('Could not resume background music:', error);
        this.musicWasPlaying = false;
        this.videoPlaying = false;
      });
    }
  }

  // Check if background music is currently playing
  isMusicPlaying() {
    return this.backgroundMusic && !this.backgroundMusic.paused;
  }

  // Check if video is currently playing
  isVideoPlaying() {
    return this.videoPlaying;
  }

  // Force pause background music
  forcePause() {
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
      this.musicWasPlaying = true;
      console.log('Background music force paused');
    }
  }

  // Force resume background music
  forceResume() {
    if (this.backgroundMusic && this.backgroundMusic.paused) {
      this.backgroundMusic.play().then(() => {
        this.musicWasPlaying = false;
        console.log('Background music force resumed');
      }).catch(error => {
        console.log('Could not force resume background music:', error);
      });
    }
  }
}

// Create a singleton instance
const audioManager = new AudioManager();

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => audioManager.init());
  } else {
    audioManager.init();
  }
}

export default audioManager;

