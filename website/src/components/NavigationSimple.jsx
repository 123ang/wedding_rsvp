import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcherSimple from './LanguageSwitcherSimple';
import './Navigation.css';

const NavigationSimple = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-top">
          <h1 className="nav-title">我们的婚礼</h1>
          <LanguageSwitcherSimple />
        </div>
        <ul className="nav-links">
          <li>
            <Link 
              to="/bride" 
              className={location.pathname === '/bride' ? 'active' : ''}
            >
              新娘婚礼
            </Link>
          </li>
          <li>
            <Link 
              to="/groom" 
              className={location.pathname === '/groom' ? 'active' : ''}
            >
              新郎婚礼
            </Link>
          </li>
          <li>
            <Link 
              to="/gallery" 
              className={location.pathname === '/gallery' ? 'active' : ''}
            >
              照片画廊
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavigationSimple;
