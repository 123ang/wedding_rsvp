// API Configuration
// Vite uses import.meta.env instead of process.env
// In production, use relative path to work with Nginx proxy
// In development, use localhost or VITE_API_URL
const getApiBaseUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (when deployed), use relative path
  // This will work with Nginx proxy at https://jsang-psong-wedding.com/api
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, default to localhost:3002 (where API runs locally)
  return 'http://localhost:3002/api';
};

export const API_BASE_URL = getApiBaseUrl();

