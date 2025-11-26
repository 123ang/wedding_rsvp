import { useState } from 'react';
import './LanguageSwitcher.css';

const LanguageSwitcherSimple = () => {
  const [currentLang, setCurrentLang] = useState('zh-CN');

  const changeLanguage = (lng) => {
    setCurrentLang(lng);
    // You can add localStorage persistence here if needed
    localStorage.setItem('language', lng);
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${currentLang === 'zh-CN' ? 'active' : ''}`}
        onClick={() => changeLanguage('zh-CN')}
        title="中文"
      >
        中文
      </button>
      <button
        className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button
        className={`lang-btn ${currentLang === 'ja' ? 'active' : ''}`}
        onClick={() => changeLanguage('ja')}
        title="日本語"
      >
        日本語
      </button>
    </div>
  );
};

export default LanguageSwitcherSimple;
