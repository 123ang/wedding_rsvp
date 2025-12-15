import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, checkAdminAuth } from '../services/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in (backup check, GuestRoute also handles this)
  useEffect(() => {
    const checkAuth = () => {
      const { success } = checkAdminAuth();
      if (success) {
        // Already logged in, redirect to dashboard
        navigate('/admin/dashboard', { replace: true });
      }
    };
    
    // Check immediately
    checkAuth();
    
    // Also check on focus (when user navigates back to this page)
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminLogin(email, password);
      
      if (data.success) {
        // Login successful, redirect to dashboard (replace so back button doesn't go to login)
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h1>Admin Login</h1>
        <p className="admin-login-subtitle">Wedding RSVP Management</p>
        
        {error && <div className="admin-error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} className="admin-login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
