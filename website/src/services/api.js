import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL } from '../config/api';

// API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add admin auth headers if available
    const adminEmail = localStorage.getItem('admin_email');
    const adminId = localStorage.getItem('admin_id');
    
    if (adminEmail && adminId) {
      config.headers['x-admin-email'] = adminEmail;
      config.headers['x-admin-id'] = adminId;
    }
    
    console.log('Making API request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
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
    const response = await apiClient.post('/bride-rsvp', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      attending: formData.attending,
      number_of_guests: formData.number_of_guests
    });

    return {
      message: response.data.message || "RSVP submitted successfully.",
      success: response.data.success !== false,
      data: response.data
    };
  } catch (error) {
    console.error('Bride RSVP error:', error);
    if (error.response?.status === 409) {
      throw error.response.data;
    }
    throw {
      message: error.response?.data?.message || "Unable to submit RSVP.",
      success: false
    };
  }
};

export const submitGroomRSVP = async (formData) => {
  try {
    const response = await apiClient.post('/groom-rsvp', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      attending: formData.attending,
      number_of_guests: formData.number_of_guests,
      organization: formData.organization || null
    });

    return {
      message: response.data.message || "RSVP submitted successfully.",
      success: response.data.success !== false,
      data: response.data
    };
  } catch (error) {
    console.error('Groom RSVP error:', error);
    if (error.response?.status === 409) {
      throw error.response.data;
    }
    throw {
      message: error.response?.data?.message || "Unable to submit RSVP.",
      success: false
    };
  }
};

// Admin authentication
export const adminLogin = async (email, password) => {
  try {
    const response = await apiClient.post('/admin/login', {
      email,
      password
    });

    if (response.data.success) {
      // Store admin session in localStorage
      localStorage.setItem('admin_email', response.data.email);
      localStorage.setItem('admin_id', response.data.id);
      localStorage.setItem('admin_role', response.data.role || 'admin');
      
      return {
        message: response.data.message || "Login successful.",
        success: true,
        email: response.data.email,
        role: response.data.role || 'admin'
      };
    } else {
      throw {
        response: {
          status: 401,
          data: {
            message: response.data.message || "Invalid credentials.",
            success: false
          }
        }
      };
    }
  } catch (error) {
    console.error('Admin login error:', error);
    throw error.response?.data || {
      message: "Login failed.",
      success: false
    };
  }
};

// Get all RSVPs (admin only)
export const getAllRSVPs = async () => {
  try {
    // Check if admin is logged in
    const adminEmail = localStorage.getItem('admin_email');
    if (!adminEmail) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Unauthorized access.",
            success: false
          }
        }
      };
    }

    const response = await apiClient.get('/admin/rsvps');
    return response.data;
  } catch (error) {
    console.error('Get RSVPs error:', error);
    throw error.response?.data || {
      message: "Failed to fetch RSVPs.",
      success: false
    };
  }
};

// Update payment amount (admin only)
export const updatePaymentAmount = async (id, paymentAmount) => {
  try {
    const adminEmail = localStorage.getItem('admin_email');
    if (!adminEmail) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Unauthorized access.",
            success: false
          }
        }
      };
    }

    const response = await apiClient.post('/admin/update-payment', {
      id,
      payment_amount: paymentAmount
    });

    return {
      message: response.data.message || "Payment amount updated successfully.",
      success: response.data.success !== false,
      data: response.data
    };
  } catch (error) {
    console.error('Update payment error:', error);
    throw {
      message: error.response?.data?.message || "Failed to update payment amount.",
      success: false
    };
  }
};

// Update seat table (admin only)
export const updateSeatTable = async (id, seatTable) => {
  try {
    const adminEmail = localStorage.getItem('admin_email');
    if (!adminEmail) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Unauthorized access.",
            success: false
          }
        }
      };
    }

    const response = await apiClient.post('/admin/update-seat', {
      id,
      seat_table: seatTable || null
    });

    return {
      message: response.data.message || "Seat table updated successfully.",
      success: response.data.success !== false,
      data: response.data
    };
  } catch (error) {
    console.error('Update seat_table error:', error);
    throw {
      message: error.response?.data?.message || "Failed to update seat table.",
      success: false
    };
  }
};

// Update relationship (admin only)
export const updateRelationship = async (id, relationship) => {
  try {
    const adminEmail = localStorage.getItem('admin_email');
    if (!adminEmail) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Unauthorized access.",
            success: false
          }
        }
      };
    }

    const response = await apiClient.post('/admin/update-relationship', {
      id,
      relationship: relationship || null
    });

    return {
      message: response.data.message || "Relationship updated successfully.",
      success: response.data.success !== false,
      data: response.data
    };
  } catch (error) {
    console.error('Update relationship error:', error);
    throw {
      message: error.response?.data?.message || "Failed to update relationship.",
      success: false
    };
  }
};

// Update remark (admin only)
export const updateRemark = async (id, remark) => {
  try {
    const adminEmail = localStorage.getItem('admin_email');
    if (!adminEmail) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Unauthorized access.",
            success: false
          }
        }
      };
    }

    const response = await apiClient.post('/admin/update-remark', {
      id,
      remark: remark || null
    });

    return {
      message: response.data.message || "Remark updated successfully.",
      success: response.data.success !== false,
      data: response.data
    };
  } catch (error) {
    console.error('Update remark error:', error);
    throw {
      message: error.response?.data?.message || "Failed to update remark.",
      success: false
    };
  }
};

// Get unique relationships (admin only)
export const getRelationships = async () => {
  try {
    const adminEmail = localStorage.getItem('admin_email');
    if (!adminEmail) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Unauthorized access.",
            success: false
          }
        }
      };
    }

    const response = await apiClient.get('/admin/relationships');
    return response.data.relationships || [];
  } catch (error) {
    console.error('Get relationships error:', error);
    return [];
  }
};

// Admin logout
export const adminLogout = () => {
  localStorage.removeItem('admin_email');
  localStorage.removeItem('admin_id');
  return {
    message: "Logged out successfully.",
    success: true
  };
};

// Check admin authentication
export const checkAdminAuth = () => {
  const adminEmail = localStorage.getItem('admin_email');
  const adminId = localStorage.getItem('admin_id');
  let adminRole = localStorage.getItem('admin_role');
  
  // If role is not in localStorage, default to 'admin' for backward compatibility
  // But also check if we can fetch it from the API if needed
  if (!adminRole && adminEmail && adminId) {
    console.warn('Admin role not found in localStorage, defaulting to admin');
    adminRole = 'admin';
    // Optionally, we could fetch the role from the API here
  }
  
  return {
    success: !!adminEmail,
    email: adminEmail,
    id: adminId,
    role: adminRole || 'admin' // Default to 'admin' if not set
  };
};

// Get all users (Admin only)
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user role (Admin only)
export const updateUserRole = async (id, role) => {
  try {
    const response = await apiClient.post('/admin/update-role', { id, role });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new user (Admin only)
export const createUser = async (email, password, role) => {
  try {
    const response = await apiClient.post('/admin/create-user', {
      email,
      password,
      role: role || 'photographer'
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete user (Admin only)
export const deleteUser = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export default apiClient;

