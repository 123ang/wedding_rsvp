# Phase 1: API Deployment & Mobile App Integration Guide

## Overview

This guide covers:
1. Deploying Node.js API to VPS
2. Configuring Nginx for API
3. Connecting mobile app to real API
4. Testing everything works

## Part 1: Deploy API to VPS

### Step 1: Prepare VPS

```bash
# SSH into your VPS
ssh root@your_vps_ip

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Upload API Files

**Option A: Using Git (Recommended)**
```bash
# On VPS
cd /var/www
git clone your_repo_url wedding_api
cd wedding_api/api
npm install
```

**Option B: Using SCP/FTP**
```bash
# On your local machine
# Compress the api folder
cd C:\Users\User\Desktop\Website\wedding_rsvp
tar -czf api.tar.gz api/

# Upload to VPS
scp api.tar.gz root@your_vps_ip:/var/www/

# On VPS
cd /var/www
tar -xzf api.tar.gz
cd api
npm install
```

### Step 3: Configure Environment

```bash
# On VPS, create .env file
cd /var/www/api
nano .env
```

Add this content:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=wedding_rsvp

# Server Configuration
PORT=3002
NODE_ENV=production
```

**Note:** Using port **3002** (since 3001 and 4001 are used)

### Step 4: Test API Locally on VPS

```bash
# Test the API
cd /var/www/api
node server.js

# You should see:
# ========================================
# Wedding RSVP API Server
# ========================================
# Server running on port 3002
# ✓ MySQL database connected successfully
```

Press `Ctrl+C` to stop, then start with PM2:

```bash
# Start with PM2
pm2 start server.js --name wedding-api

# Check status
pm2 status

# View logs
pm2 logs wedding-api

# Make PM2 start on boot
pm2 startup
pm2 save
```

### Step 5: Configure Nginx

Update your Nginx config:

```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

**Updated Nginx Configuration:**

```nginx
server {
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    access_log /var/log/nginx/jsang-psong-wedding.com.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.com.error.log;
    
    # API Proxy (Node.js on port 3002)
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-admin-email, x-admin-id' always;
        
        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-admin-email, x-admin-id';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Frontend - React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|pdf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/jsang-psong-wedding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jsang-psong-wedding.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.jsang-psong-wedding.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = jsang-psong-wedding.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    listen [::]:80;
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    return 404;
}
```

**Test and reload Nginx:**

```bash
# Test configuration
sudo nginx -t

# If OK, reload
sudo systemctl reload nginx
```

### Step 6: Update Website Frontend

Update the website to use production API:

```bash
# On VPS
cd /var/www/jsang-psong-wedding.com
nano .env
```

Add:
```env
VITE_API_URL=https://jsang-psong-wedding.com/api
```

Or if you already built the site, the default will use the same domain.

### Step 7: Test API

```bash
# Test from VPS
curl https://jsang-psong-wedding.com/api/health

# Should return: {"status":"OK","message":"Wedding RSVP API is running"}
```

## Part 2: Connect Mobile App to Real API

### Step 1: Update Mobile App Configuration

Create API configuration file:

```bash
# In your local machine
cd mobile_app
```

Create `src/config/api.js`:

```javascript
// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://your_vps_ip:3002/api'  // Development: direct to VPS
  : 'https://jsang-psong-wedding.com/api';  // Production: through Nginx

export default API_BASE_URL;
```

### Step 2: Create Real API Service

Create `src/services/api.js`:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth headers
apiClient.interceptors.request.use(
  async (config) => {
    const adminEmail = await AsyncStorage.getItem('admin_email');
    const adminId = await AsyncStorage.getItem('admin_id');
    
    if (adminEmail && adminId) {
      config.headers['x-admin-email'] = adminEmail;
      config.headers['x-admin-id'] = adminId;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// API Functions
export const api = {
  // Admin
  adminLogin: async (email, password) => {
    const response = await apiClient.post('/admin/login', { email, password });
    if (response.data.success) {
      await AsyncStorage.setItem('admin_email', response.data.email);
      await AsyncStorage.setItem('admin_id', response.data.id.toString());
    }
    return response.data;
  },

  // RSVPs
  getAllRSVPs: async () => {
    const response = await apiClient.get('/admin/rsvps');
    return response.data;
  },

  submitBrideRSVP: async (data) => {
    const response = await apiClient.post('/bride-rsvp', data);
    return response.data;
  },

  submitGroomRSVP: async (data) => {
    const response = await apiClient.post('/groom-rsvp', data);
    return response.data;
  },

  // Photos (to be implemented in Phase 2)
  getPhotos: async () => {
    // TODO: Implement when backend photo endpoints are ready
    throw new Error('Photo API not implemented yet');
  },

  uploadPhoto: async (formData) => {
    // TODO: Implement when backend photo upload is ready
    throw new Error('Photo upload not implemented yet');
  },
};

export default api;
```

### Step 3: Test API Connection

Create a test screen:

```bash
cd mobile_app/src
mkdir screens
```

Create `screens/ApiTestScreen.js`:

```javascript
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, TextInput } from 'react-native';
import { api } from '../services/api';

export default function ApiTestScreen() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('angjinsheng@gmail.com');
  const [password, setPassword] = useState('920214');

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await api.adminLogin(email, password);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
    setLoading(false);
  };

  const testGetRSVPs = async () => {
    setLoading(true);
    try {
      const response = await api.getAllRSVPs();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Login Test</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Test Login" onPress={testLogin} disabled={loading} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get RSVPs Test</Text>
        <Button title="Test Get RSVPs" onPress={testGetRSVPs} disabled={loading} />
      </View>

      <View style={styles.result}>
        <Text style={styles.resultTitle}>Result:</Text>
        <Text style={styles.resultText}>{result || 'No result yet'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  result: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  resultTitle: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
```

### Step 4: Add Test Screen to Navigation

Update `App.js` to include the test screen:

```javascript
// Add to imports
import ApiTestScreen from './src/screens/ApiTestScreen';

// Add to Stack Navigator (inside MainNavigator)
<Stack.Screen 
  name="ApiTest" 
  component={ApiTestScreen} 
  options={{ title: 'API Test' }} 
/>

// Add button in Settings screen to navigate to test
<Button 
  title="Test API Connection" 
  onPress={() => navigation.navigate('ApiTest')} 
/>
```

## Part 3: Testing Checklist

### Test API on VPS

```bash
# 1. Health check
curl https://jsang-psong-wedding.com/api/health

# 2. Test login
curl -X POST https://jsang-psong-wedding.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"angjinsheng@gmail.com","password":"920214"}'

# 3. Test RSVP submission
curl -X POST https://jsang-psong-wedding.com/api/bride-rsvp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","phone":"0123456789","attending":true,"number_of_guests":2}'
```

### Test Mobile App

1. **Start mobile app:**
   ```bash
   cd mobile_app
   npx expo start
   ```

2. **Navigate to API Test screen**
3. **Test Login** - Should return success with email
4. **Test Get RSVPs** - Should return list of RSVPs
5. **Check for errors** - Look at console logs

### Test Website

1. Open https://jsang-psong-wedding.com
2. Try submitting RSVP
3. Login to admin dashboard
4. Check if data loads

## Troubleshooting

### API Not Starting
```bash
# Check PM2 logs
pm2 logs wedding-api

# Check if port is in use
sudo lsof -i :3002

# Restart API
pm2 restart wedding-api
```

### Nginx 502 Error
```bash
# Check if API is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# Test Nginx config
sudo nginx -t
```

### Mobile App Connection Error
- Check if VPS IP is correct in `api.js`
- Make sure port 3002 is open on firewall
- Try accessing API URL in browser first

### CORS Errors
- Check Nginx CORS headers are configured
- Verify API is returning correct headers
- Check browser console for specific error

## PM2 Useful Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs wedding-api

# Restart
pm2 restart wedding-api

# Stop
pm2 stop wedding-api

# Delete
pm2 delete wedding-api

# Monitor
pm2 monit
```

## Success Criteria

✅ API running on VPS (port 3002)
✅ PM2 managing API process
✅ Nginx proxying /api/ to Node.js
✅ Website can connect to API
✅ Mobile app can connect to API
✅ Admin login works
✅ RSVP submission works
✅ Data persists in MySQL database

## Next Steps After Phase 1

Once everything is working:
- Phase 2: Add photo upload endpoints
- Phase 3: Implement remaining mobile features
- Phase 4: App store deployment

---

**Need Help?**
- Check PM2 logs: `pm2 logs wedding-api`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Test API directly: `curl http://localhost:3002/api/health`

