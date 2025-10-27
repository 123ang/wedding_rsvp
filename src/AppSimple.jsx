import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationWithLang from './components/NavigationWithLang';
import BridePageSimple from './pages/BridePageSimple';
import GroomPageSimple from './pages/GroomPageSimple';
import GalleryPageSimple from './pages/GalleryPageSimple';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import './styles/mobile-optimizations.css';

function AppSimple() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <NavigationWithLang />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<BridePageSimple />} />
              <Route path="/groom" element={<GroomPageSimple />} />
              <Route path="/gallery" element={<GalleryPageSimple />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default AppSimple;
