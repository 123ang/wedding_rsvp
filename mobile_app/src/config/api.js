// API Configuration
import Constants from 'expo-constants';

// Determine if we're in development or production
const ENV = {
  dev: {
    // LOCAL DEVELOPMENT - Change this to your computer's IP when testing on Android
    // Find your IP: Windows: ipconfig | findstr IPv4, Mac/Linux: ifconfig
    // Note: Use your computer's IP, NOT localhost (localhost won't work from Android)
    apiUrl: 'https://jsang-psong-wedding.com/api', // Your local IP for development (port 3001)
  },
  staging: {
    apiUrl: 'https://jsang-psong-wedding.com/api',
  },
  prod: {
    // PRODUCTION - VPS domain
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

