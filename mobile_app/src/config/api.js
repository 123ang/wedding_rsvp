// API Configuration
import Constants from 'expo-constants';

// Determine if we're in development or production
const ENV = {
  dev: {
    apiUrl: 'http://192.168.1.100:3002/api', // Replace with your computer's local IP
    // Or use your VPS IP for testing: 'http://your_vps_ip:3002/api'
  },
  staging: {
    apiUrl: 'https://jsang-psong-wedding.com/api',
  },
  prod: {
    apiUrl: 'https://jsang-psong-wedding.com/api',
  },
};

// Get environment
const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  } else if (Constants.manifest?.releaseChannel === 'staging') {
    return ENV.staging;
  }
  return ENV.prod;
};

export default getEnvVars();

