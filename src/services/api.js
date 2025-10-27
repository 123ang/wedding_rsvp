import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL } from '../config/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('Making API request:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API response:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(handleApiError(error));
  }
);

export const submitBrideRSVP = async (formData) => {
  try {
    const response = await apiClient.post('/bride-rsvp.php', formData);
    return response.data;
  } catch (error) {
    console.error('Bride RSVP error:', error);
    throw error;
  }
};

export const submitGroomRSVP = async (formData) => {
  try {
    const response = await apiClient.post('/groom-rsvp.php', formData);
    return response.data;
  } catch (error) {
    console.error('Groom RSVP error:', error);
    throw error;
  }
};

export default apiClient;

