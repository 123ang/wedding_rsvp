// Error handling utilities

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error - please check your connection',
      status: 0
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1
    };
  }
};

export const logError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  // In production, you might want to send errors to a logging service
  // Vite uses import.meta.env.PROD instead of process.env.NODE_ENV
  if (import.meta.env.PROD) {
    // Example: send to error tracking service
    // errorTrackingService.log(error, context);
  }
};
