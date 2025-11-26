import { useState } from 'react';
import './EnvelopeIntro.css';

const EnvelopeIntro = ({ onOpened }) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Dispatch global event to enable music
    document.dispatchEvent(new CustomEvent('enable-music'));
    // Wait for animation then notify parent to hide
    setTimeout(() => {
      onOpened && onOpened();
    }, 1600);
  };

  return (
    <div className={`envelope-overlay ${isOpening ? 'opening' : ''}`} onClick={handleOpen}>
      <div className="envelope-scene">
        <div className="envelope">
          <div className="envelope-back"></div>
          <div className="envelope-flap"></div>
          <div className="envelope-card">
            <div className="envelope-icon">💌</div>
            <div className="envelope-title">You're Invited!</div>
            <div className="envelope-instruction">Tap to open</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvelopeIntro;


