import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reverseLanguageMap } from './LanguageRouteWrapper';
import './Navigation.css';
import './LanguageSwitcher.css';

const NavigationWithLang = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Extract current language from URL or use current i18n language
  const getCurrentLang = () => {
    const pathMatch = location.pathname.match(/\/(bride|groom)\/(en|cn|jp)/);
    if (pathMatch) {
      return pathMatch[2];
    }
    return reverseLanguageMap[i18n.language] || 'cn';
  };

  const currentLang = getCurrentLang();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    const urlLang = reverseLanguageMap[lng] || 'cn';
    
    // Update URL if we're on bride or groom page
    const pathMatch = location.pathname.match(/\/(bride|groom)\/(en|cn|jp)/);
    if (pathMatch) {
      const page = pathMatch[1];
      navigate(`/${page}/${urlLang}`, { replace: true });
    }
  };

  // Hide navigation buttons on groom-only page
  const isGroomOnlyPage = location.pathname === '/groom-only';

  return (
    <nav className="navigation">
      <div className="nav-container">
        {!isGroomOnlyPage && (
        <ul className="nav-links">
          <li>
            <Link 
              to={`/bride/${currentLang}`}
              className={location.pathname.startsWith('/bride/') ? 'active' : ''}
            >
              {t('navigation.brideWedding')}
            </Link>
          </li>
          <li>
            <Link 
              to={`/groom/${currentLang}`}
              className={location.pathname.startsWith('/groom/') && !location.pathname.startsWith('/groom-only') ? 'active' : ''}
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
        )}
        <div className="nav-right">
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
            {!isGroomOnlyPage && (
            <button
              className={`lang-btn ${i18n.language === 'ja' ? 'active' : ''}`}
              onClick={() => changeLanguage('ja')}
              title="日本語"
            >
              日本語
            </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationWithLang;
