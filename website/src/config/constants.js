// API Configuration
// Use relative paths to avoid local network access prompts
const API_CONFIG = {
  // For development (using Vite proxy - empty string means relative to current domain)
  DEV_API_URL: '/api',
  
  // For production - use relative path (works with Nginx proxy)
  // This prevents browser from asking for "Local network access" permission
  PROD_API_URL: '/api',
  
  // Get the current API URL based on environment
  getBaseURL: () => {
    // Always use relative path - works in both dev and production
    // Nginx will proxy /api to http://localhost:3002/api
    return '/api';
  }
};

export const API_BASE_URL = API_CONFIG.getBaseURL();

// Export for easy access
export default {
  API_BASE_URL,
  API_CONFIG
};
