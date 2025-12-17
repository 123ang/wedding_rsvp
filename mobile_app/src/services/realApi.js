 /**
 * Real API Service
 * Connects to the Node.js backend API
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/api';

// Create axios instance
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
      const adminEmail = await AsyncStorage.getItem('admin_email');
      const adminId = await AsyncStorage.getItem('admin_id');
      
      if (adminEmail && adminId) {
        config.headers['x-admin-email'] = adminEmail;
        config.headers['x-admin-id'] = adminId;
      }
    } catch (error) {
      console.error('Error reading auth from storage:', error);
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
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
    // Only log non-network errors (network errors are expected if API is down)
    if (error.response) {
      console.error(`[API] Response error ${error.response.status}: ${error.config?.url}`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`[API] Request timeout: ${error.config?.url}`);
    } else {
      // Network error - don't log, it's expected if API is not running
      // console.log(`[API] Network error: ${error.config?.url}`);
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear auth
      AsyncStorage.multiRemove(['admin_email', 'admin_id']);
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
      await AsyncStorage.setItem('admin_email', response.data.email);
      await AsyncStorage.setItem('admin_id', response.data.id.toString());
    }
    
    return response.data;
  },

  adminLogout: async () => {
    await AsyncStorage.multiRemove(['admin_email', 'admin_id']);
    return { success: true };
  },

  checkAuth: async () => {
    const email = await AsyncStorage.getItem('admin_email');
    const id = await AsyncStorage.getItem('admin_id');
    return { success: !!(email && id), email, id };
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
    // Normalize phone (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');
    const response = await apiClient.get(`/verify-phone/${normalizedPhone}`);
    return response.data;
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
  getPhotos: async (page = 1, limit = 20, userPhone = null) => {
    const params = { page, limit };
    if (userPhone) params.user_phone = userPhone;
    
    const response = await apiClient.get('/photos', { params });
    return response.data;
  },

  getPhoto: async (photoId, userPhone = null) => {
    const params = userPhone ? { user_phone: userPhone } : {};
    const response = await apiClient.get(`/photos/${photoId}`, { params });
    // Backend returns { success, photo }
    return response.data.photo || response.data;
  },

  uploadPhoto: async (formData) => {
    const response = await apiClient.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePhoto: async (photoId, userPhone) => {
    const response = await apiClient.delete(`/photos/${photoId}`, {
      data: { user_phone: userPhone },
    });
    return response.data;
  },

  // Comments
  getComments: async (photoId, page = 1, limit = 50, userPhone = null) => {
    const params = { page, limit };
    if (userPhone) params.user_phone = userPhone;
    
    const response = await apiClient.get(`/comments/photo/${photoId}`, { params });
    return response.data;
  },

  addComment: async (photoId, userName, userPhone, text) => {
    const response = await apiClient.post('/comments', {
      photo_id: photoId,
      user_phone: userPhone,
      text,
    });
    return response.data;
  },

  updateComment: async (commentId, userPhone, text) => {
    const response = await apiClient.put(`/comments/${commentId}`, {
      user_phone: userPhone,
      text,
    });
    return response.data;
  },

  deleteComment: async (commentId, userPhone) => {
    const response = await apiClient.delete(`/comments/${commentId}`, {
      data: { user_phone: userPhone },
    });
    return response.data;
  },

  // Likes
  likePhoto: async (photoId, userPhone) => {
    const response = await apiClient.post(`/likes/photo/${photoId}`, {
      user_phone: userPhone,
    });
    // API returns: { success, message, liked, likes_count }
    const data = response.data || {};
    return {
      photoId,
      likedByMe: !!data.liked,
      likes: typeof data.likes_count === 'number' ? data.likes_count : undefined,
    };
  },

  // Collections (save/unsave photo)
  toggleSavePhoto: async (photoId, userPhone) => {
    const response = await apiClient.post(`/collections/photo/${photoId}`, {
      user_phone: userPhone,
    });
    const data = response.data || {};
    return {
      photoId,
      savedByMe: !!data.saved,
      saves: typeof data.saves_count === 'number' ? data.saves_count : undefined,
    };
  },

  getMyCollections: async (userPhone) => {
    const response = await apiClient.get('/collections/my', {
      params: { user_phone: userPhone },
    });
    return response.data;
  },

  deleteVideo: async (videoId, userPhone) => {
    const response = await apiClient.delete(`/videos/${videoId}`, {
      data: { user_phone: userPhone },
    });
    return response.data;
  },

  likeComment: async (commentId, userPhone) => {
    const response = await apiClient.post(`/likes/comment/${commentId}`, {
      user_phone: userPhone,
    });
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

