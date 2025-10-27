import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationWithLang from './components/NavigationWithLang';
import BridePage from './pages/BridePage';
import GroomPage from './pages/GroomPage';
import GalleryPage from './pages/GalleryPage';
import VideosPage from './pages/VideosPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import BackgroundMusic from './components/BackgroundMusic';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import './styles/mobile-optimizations.css';
import './styles/winter-wedding-theme.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={
              <>
                <BackgroundMusic />
                <NavigationWithLang />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<BridePage />} />
                    <Route path="/groom" element={<GroomPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/videos" element={<VideosPage />} />
                  </Routes>
                </main>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

