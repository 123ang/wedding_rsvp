import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-top">
          <h1 className="nav-title">{t('navigation.title')}</h1>
          <LanguageSwitcher />
        </div>
        <ul className="nav-links">
          <li>
            <Link 
              to="/bride" 
              className={location.pathname === '/bride' ? 'active' : ''}
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
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;

