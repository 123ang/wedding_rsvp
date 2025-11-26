// API Configuration
// Change this to your domain when deploying
const API_CONFIG = {
  // For development (using Vite proxy - empty string means relative to current domain)
  DEV_API_URL: '/api',
  
  // For production - change this to your actual domain
  // PROD_API_URL: 'https://jsang-psong-wedding.com/api',
  PROD_API_URL: 'http://localhost/wedding_rsvp/api',
  
  // Get the current API URL based on environment
  getBaseURL: () => {
    // Check if we're in production
    if (import.meta.env.PROD) {
      return API_CONFIG.PROD_API_URL;
    }
    // Development mode - use Vite proxy
    return API_CONFIG.DEV_API_URL;
  }
};

export const API_BASE_URL = API_CONFIG.getBaseURL();

// Export for easy access
export default {
  API_BASE_URL,
  API_CONFIG
};
