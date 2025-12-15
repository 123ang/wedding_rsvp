import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavigationWithLang from './components/NavigationWithLang';
import BridePage from './pages/BridePage';
import GroomPage from './pages/GroomPage';
import GroomOnlyPage from './pages/GroomOnlyPage';
import GalleryPage from './pages/GalleryPage';
import VideosPage from './pages/VideosPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import BackgroundMusic from './components/BackgroundMusic';
import ErrorBoundary from './components/ErrorBoundary';
import LanguageRouteWrapper from './components/LanguageRouteWrapper';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import './App.css';
import './styles/mobile-optimizations.css';
import './styles/winter-wedding-theme.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/admin/login" element={
              <GuestRoute>
                <AdminLoginPage />
              </GuestRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <>
                <BackgroundMusic />
                <NavigationWithLang />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Navigate to="/bride/cn" replace />} />
                    <Route path="/bride/:lang" element={
                      <LanguageRouteWrapper defaultPage="bride">
                        <BridePage />
                      </LanguageRouteWrapper>
                    } />
                    <Route path="/groom/:lang" element={
                      <LanguageRouteWrapper defaultPage="groom">
                        <GroomPage />
                      </LanguageRouteWrapper>
                    } />
                    <Route path="/bride" element={<Navigate to="/bride/cn" replace />} />
                    <Route path="/groom" element={<Navigate to="/groom/cn" replace />} />
                    <Route path="/groom-only/:lang" element={
                      <LanguageRouteWrapper defaultPage="groom-only">
                        <GroomOnlyPage />
                      </LanguageRouteWrapper>
                    } />
                    <Route path="/groom-only" element={<Navigate to="/groom-only/cn" replace />} />
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

