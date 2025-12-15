import { Navigate } from 'react-router-dom';
import { checkAdminAuth } from '../services/api';

/**
 * GuestRoute - Redirects authenticated users away from public pages (like login)
 * If user is already logged in, redirect them to dashboard
 */
const GuestRoute = ({ children }) => {
  const { success } = checkAdminAuth();

  if (success) {
    // Already authenticated, redirect to dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Not authenticated, allow access to public page (login)
  return children;
};

export default GuestRoute;


