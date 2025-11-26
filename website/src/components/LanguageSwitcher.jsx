import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === 'zh-CN' ? 'active' : ''}`}
        onClick={() => changeLanguage('zh-CN')}
        title="中文"
      >
        中文
      </button>
      <button
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button
        className={`lang-btn ${i18n.language === 'ja' ? 'active' : ''}`}
        onClick={() => changeLanguage('ja')}
        title="日本語"
      >
        日本語
      </button>
    </div>
  );
};

export default LanguageSwitcher;
