import { Navigate } from 'react-router-dom';
import { checkAdminAuth } from '../services/api';

/**
 * GuestRoute - Redirects authenticated users away from public pages (like login)
 * If user is already logged in, redirect them to dashboard
 */
const GuestRoute = ({ children }) => {
  const { success, role } = checkAdminAuth();

  if (success) {
    // Already authenticated, redirect based on role.
    return <Navigate to={role === 'photographer' ? '/photographer/upload' : '/admin/dashboard'} replace />;
  }

  // Not authenticated, allow access to public page (login)
  return children;
};

export default GuestRoute;

