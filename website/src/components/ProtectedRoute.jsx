import { Navigate } from 'react-router-dom';
import { checkAdminAuth } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const { success } = checkAdminAuth();

  if (!success) {
    // Not authenticated, redirect to login
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated, render the protected component
  return children;
};

export default ProtectedRoute;

