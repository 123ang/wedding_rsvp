import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navigation.css';
import './LanguageSwitcher.css';

const NavigationWithLang = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              {t('navigation.brideWedding')}
            </Link>
          </li>
          <li>
            <Link 
              to="/groom" 
              className={location.pathname === '/groom' ? 'active' : ''}
            >
              {t('navigation.groomWedding')}
            </Link>
          </li>
                 <li>
                   <Link
                     to="/gallery"
                     className={location.pathname === '/gallery' ? 'active' : ''}
                   >
                     {t('navigation.photoGallery')}
                   </Link>
                 </li>
                 <li>
                   <Link
                     to="/videos"
                     className={location.pathname === '/videos' ? 'active' : ''}
                   >
                     {t('navigation.videos')}
                   </Link>
                 </li>
        </ul>
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
        </div>
      </div>
    </nav>
  );
};

export default NavigationWithLang;
