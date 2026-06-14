 /**
 * Real API Service
 * Connects to the Node.js backend API
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/api';

// Create axios instance
console.log('[API] Initializing API client with baseURL:', ENV.apiUrl);
const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const adminToken = await AsyncStorage.getItem('admin_token');
      const guestToken = await AsyncStorage.getItem('guest_token');
      
      const authToken = adminToken || guestToken;
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    } catch (error) {
      console.error('Error reading auth from storage:', error);
    }
    
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[API] ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log(`[API] Base URL: ${config.baseURL}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} ${response.config?.url}`);
    return response;
  },
  (error) => {
    // Log all errors with full details
    if (error.response) {
      console.error(`[API] Response error ${error.response.status}: ${error.config?.url}`);
      console.error(`[API] Error data:`, error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`[API] Request timeout: ${error.config?.url}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`[API] Network error - Cannot reach server:`, {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    } else {
      console.error(`[API] Network error:`, {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullError: error
      });
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear auth
      AsyncStorage.multiRemove([
        'admin_token',
        'admin_email',
        'admin_id',
        'admin_role',
        'guest_token',
      ]);
    }
    
    return Promise.reject(error);
  }
);

// API Service
const realApi = {
  // Base URL without /api (useful for static file URLs)
  apiBaseUrl: ENV.apiUrl.replace('/api', ''),
  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${ENV.apiUrl.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      throw new Error('Cannot connect to server');
    }
  },

  // Admin Authentication
  adminLogin: async (email, password) => {
    const response = await apiClient.post('/admin/login', { email, password });
    
    if (response.data.success) {
      // Save auth to storage
      await AsyncStorage.setItem('admin_token', response.data.token);
      await AsyncStorage.setItem('admin_email', response.data.email);
      await AsyncStorage.setItem('admin_id', response.data.id.toString());
      await AsyncStorage.setItem('admin_role', response.data.role || 'photographer');
    }
    
    return response.data;
  },

  adminLogout: async () => {
    await AsyncStorage.multiRemove(['admin_token', 'admin_email', 'admin_id', 'admin_role']);
    return { success: true };
  },

  checkAuth: async () => {
    const token = await AsyncStorage.getItem('admin_token');
    const email = await AsyncStorage.getItem('admin_email');
    const id = await AsyncStorage.getItem('admin_id');
    const role = await AsyncStorage.getItem('admin_role');
    return { success: !!(token && email && id), email, id, role };
  },

  // RSVP Endpoints
  submitBrideRSVP: async (data) => {
    const response = await apiClient.post('/bride-rsvp', data);
    return response.data;
  },

  submitGroomRSVP: async (data) => {
    const response = await apiClient.post('/groom-rsvp', data);
    return response.data;
  },

  // Admin - Get all RSVPs (requires admin auth)
  getAllRSVPs: async () => {
    const response = await apiClient.get('/admin/rsvps');
    return response.data;
  },

  // Public - Verify phone number for guest login (no auth required)
  verifyPhone: async (phone) => {
    console.log('[API] verifyPhone called with phone:', phone ? `${phone.substring(0, 3)}***` : 'null');
    // Normalize phone (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');
    console.log('[API] Normalized phone:', normalizedPhone ? `${normalizedPhone.substring(0, 3)}***` : 'null');
    console.log('[API] Calling GET /verify-phone/' + normalizedPhone);
    try {
      const response = await apiClient.get(`/verify-phone/${normalizedPhone}`);
      if (response.data?.token) {
        await AsyncStorage.setItem('guest_token', response.data.token);
      }
      console.log('[API] verifyPhone response:', {
        status: response.status,
        found: response.data?.found,
        rsvpsCount: response.data?.rsvps?.length || 0
      });
      return response.data;
    } catch (error) {
      console.error('[API] verifyPhone error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Admin - Update payment
  updatePayment: async (id, amount) => {
    const response = await apiClient.post('/admin/update-payment', {
      id,
      payment_amount: amount,
    });
    return response.data;
  },

  // Admin - Update seat
  updateSeat: async (id, seatTable) => {
    const response = await apiClient.post('/admin/update-seat', {
      id,
      seat_table: seatTable,
    });
    return response.data;
  },

  // Admin - Update relationship
  updateRelationship: async (id, relationship) => {
    const response = await apiClient.post('/admin/update-relationship', {
      id,
      relationship,
    });
    return response.data;
  },

  // Admin - Update remark
  updateRemark: async (id, remark) => {
    const response = await apiClient.post('/admin/update-remark', {
      id,
      remark,
    });
    return response.data;
  },

  // Admin - Get relationships
  getRelationships: async () => {
    const response = await apiClient.get('/admin/relationships');
    return response.data;
  },

  // Photos
  getPhotos: async (page = 1, limit = 20) => {
    const params = { page, limit };
    const response = await apiClient.get('/photos', { params });
    return response.data;
  },

  getPhoto: async (photoId) => {
    const response = await apiClient.get(`/photos/${photoId}`);
    // Backend returns { success, photo }
    return response.data.photo || response.data;
  },

  uploadPhoto: async (formData) => {
    console.log('[API] uploadPhoto called');
    console.log('[API] FormData keys:', Object.keys(formData));
    console.log('[API] Calling POST /photos/upload');
    try {
      const response = await apiClient.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('[API] uploadPhoto response:', {
        status: response.status,
        success: response.data?.success,
        photoId: response.data?.photo?.id || response.data?.id
      });
      return response.data;
    } catch (error) {
      console.error('[API] uploadPhoto error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },

  deletePhoto: async (photoId) => {
    const response = await apiClient.delete(`/photos/${photoId}`);
    return response.data;
  },

  // Comments
  getComments: async (photoId, page = 1, limit = 50) => {
    const params = { page, limit };
    const response = await apiClient.get(`/comments/photo/${photoId}`, { params });
    return response.data;
  },

  addComment: async (photoId, text) => {
    const response = await apiClient.post('/comments', {
      photo_id: photoId,
      text,
    });
    return response.data;
  },

  updateComment: async (commentId, text) => {
    const response = await apiClient.put(`/comments/${commentId}`, {
      text,
    });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await apiClient.delete(`/comments/${commentId}`);
    return response.data;
  },

  // Likes
  likePhoto: async (photoId) => {
    const response = await apiClient.post(`/likes/photo/${photoId}`, {});
    // API returns: { success, message, liked, likes_count }
    const data = response.data || {};
    return {
      photoId,
      likedByMe: !!data.liked,
      likes: typeof data.likes_count === 'number' ? data.likes_count : undefined,
    };
  },

  // Collections (save/unsave photo)
  toggleSavePhoto: async (photoId) => {
    const response = await apiClient.post(`/collections/photo/${photoId}`, {});
    const data = response.data || {};
    return {
      photoId,
      savedByMe: !!data.saved,
      saves: typeof data.saves_count === 'number' ? data.saves_count : undefined,
    };
  },

  getMyCollections: async () => {
    const response = await apiClient.get('/collections/my');
    return response.data;
  },

  deleteVideo: async (videoId) => {
    const response = await apiClient.delete(`/videos/${videoId}`);
    return response.data;
  },

  likeComment: async (commentId) => {
    const response = await apiClient.post(`/likes/comment/${commentId}`, {});
    return response.data;
  },

  getPhotoLikes: async (photoId) => {
    const response = await apiClient.get(`/likes/photo/${photoId}`);
    return response.data;
  },

  // Timeline
  getTimeline: async () => {
    const response = await apiClient.get('/timeline');
    return response.data;
  },

  // Seats
  getSeats: async () => {
    const response = await apiClient.get('/seats');
    return response.data;
  },

  getMySeat: async (phone) => {
    const response = await apiClient.get(`/seats/my-seat/${phone}`);
    return response.data;
  },

  // Tags
  getTags: async () => {
    const response = await apiClient.get('/photos/tags/all');
    return response.data;
  },

  // Wedding Info - can specify wedding_type (bride or groom)
  getWeddingInfo: async (weddingType = null) => {
    try {
      const normalizedType = weddingType ? String(weddingType).trim().toLowerCase() : null;
      const params = normalizedType ? { wedding_type: normalizedType } : {};
      const response = await apiClient.get('/wedding-info', { params });
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return default structure based on wedding type
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        const normalizedType = weddingType ? String(weddingType).trim().toLowerCase() : null;
        if (normalizedType === 'bride') {
          return {
            groomShortName: 'JS',
            brideShortName: 'PS',
            date: '2026-01-02',
            venue: 'Fu Hotel'
          };
        } else {
          return {
            groomShortName: 'JS',
            brideShortName: 'PS',
            date: '2026-01-04',
            venue: 'Starview Restaurant'
          };
        }
      }
      throw error;
    }
  },

  // Profiles
  getGroomProfile: async () => {
    try {
      const response = await apiClient.get('/profiles/groom');
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return default structure
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        return {
          name: 'Dr. Ang Jin Sheng',
          role: 'The Groom',
          avatar: '👔',
          occupation: '软件工程师',
          hobbies: '摄影、旅行、阅读',
          bio: '热爱生活，享受每一个美好瞬间。'
        };
      }
      throw error;
    }
  },

  getBrideProfile: async () => {
    try {
      const response = await apiClient.get('/profiles/bride');
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return default structure
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        return {
          name: 'Miss Ong Pei Shi',
          role: 'The Bride',
          avatar: '👰',
          occupation: '设计师',
          hobbies: '绘画、音乐、美食',
          bio: '充满创意和热情，喜欢用艺术表达情感。'
        };
      }
      throw error;
    }
  },
};

export default realApi;
