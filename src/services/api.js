import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { SUPABASE_URL, getSupabaseHeaders } from '../config/supabase';

// Supabase REST API client
const supabaseClient = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  timeout: 10000,
});

// Add request interceptor
supabaseClient.interceptors.request.use(
  (config) => {
    console.log('Making Supabase request:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
supabaseClient.interceptors.response.use(
  (response) => {
    console.log('Supabase response:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(handleApiError(error));
  }
);

export const submitBrideRSVP = async (formData) => {
  try {
    // Check if email already exists for bride wedding
    const checkResponse = await supabaseClient.get('/rsvps', {
      headers: getSupabaseHeaders(),
      params: {
        email: `eq.${formData.email}`,
        wedding_type: 'eq.bride',
        select: 'id'
      }
    });

    if (checkResponse.data && checkResponse.data.length > 0) {
      throw {
        response: {
          status: 409,
          data: {
            message: "This email has already submitted an RSVP for the bride's wedding.",
            success: false
          }
        }
      };
    }

    // Insert new RSVP
    const response = await supabaseClient.post('/rsvps', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      attending: formData.attending,
      number_of_guests: formData.number_of_guests,
      wedding_type: 'bride'
    }, {
      headers: getSupabaseHeaders()
    });

    return {
      message: "RSVP submitted successfully.",
      success: true,
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
    // Check if email already exists for groom wedding
    const checkResponse = await supabaseClient.get('/rsvps', {
      headers: getSupabaseHeaders(),
      params: {
        email: `eq.${formData.email}`,
        wedding_type: 'eq.groom',
        select: 'id'
      }
    });

    if (checkResponse.data && checkResponse.data.length > 0) {
      throw {
        response: {
          status: 409,
          data: {
            message: "This email has already submitted an RSVP for the groom's wedding.",
            success: false
          }
        }
      };
    }

    // Insert new RSVP
    const response = await supabaseClient.post('/rsvps', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      attending: formData.attending,
      number_of_guests: formData.number_of_guests,
      wedding_type: 'groom'
    }, {
      headers: getSupabaseHeaders()
    });

    return {
      message: "RSVP submitted successfully.",
      success: true,
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
    // Query admin_users table
    const response = await supabaseClient.get('/admin_users', {
      headers: getSupabaseHeaders(),
      params: {
        email: `eq.${email}`,
        select: 'id,email,password'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Invalid credentials.",
            success: false
          }
        }
      };
    }

    const user = response.data[0];
    
    // Simple password check (in production, use proper bcrypt verification)
    if (
      (email === 'angjinsheng@gmail.com' && password === '920214') ||
      (email === 'psong32@hotmail.com' && password === '921119')
    ) {
      // Store admin session in localStorage
      localStorage.setItem('admin_email', user.email);
      localStorage.setItem('admin_id', user.id);
      
      return {
        message: "Login successful.",
        success: true,
        email: user.email
      };
    } else {
      throw {
        response: {
          status: 401,
          data: {
            message: "Invalid credentials.",
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

    const response = await supabaseClient.get('/rsvps', {
      headers: getSupabaseHeaders(),
      params: {
        select: '*',
        order: 'created_at.desc'
      }
    });

    const rsvps = response.data.map(rsvp => ({
      type: rsvp.wedding_type,
      id: rsvp.id,
      name: rsvp.name,
      email: rsvp.email,
      phone: rsvp.phone,
      attending: rsvp.attending,
      number_of_guests: rsvp.number_of_guests,
      payment_amount: parseFloat(rsvp.payment_amount || 0),
      created_at: rsvp.created_at
    }));

    // Calculate totals
    const totalAttending = rsvps.filter(r => r.attending).length;
    const totalNotAttending = rsvps.filter(r => !r.attending).length;
    const totalGuests = rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.number_of_guests, 0);
    const totalPayment = rsvps.reduce((sum, r) => sum + r.payment_amount, 0);

    return {
      success: true,
      rsvps,
      summary: {
        total_rsvps: rsvps.length,
        total_attending: totalAttending,
        total_not_attending: totalNotAttending,
        total_guests: totalGuests,
        total_payment: totalPayment
      }
    };
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

    const response = await supabaseClient.patch(`/rsvps?id=eq.${id}`, {
      payment_amount: paymentAmount
    }, {
      headers: getSupabaseHeaders()
    });

    return {
      message: "Payment amount updated successfully.",
      success: true,
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
  return {
    success: !!adminEmail,
    email: adminEmail
  };
};

export default supabaseClient;

