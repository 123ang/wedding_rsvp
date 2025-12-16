# Complete Deployment Guide - All Phases

## Overview

This guide covers deploying all components of the wedding RSVP system to production.

---

## Components to Deploy

1. ✅ **Website** (React) - Already deployed
2. ⏳ **API** (Node.js) - Ready to deploy
3. ⏳ **Database** (MySQL) - Schema ready
4. ⏳ **Mobile App** (React Native) - Ready to build

---

## Phase 1: Database Setup

### Step 1: Run Basic Schema

```bash
# Connect to MySQL
mysql -u root -p wedding_rsvp

# Run basic schema
mysql -u root -p wedding_rsvp < database/create_tables.sql
```

### Step 2: Run Phase 2 Schema

```bash
# Add photos, comments, likes, videos, seats, timeline tables
mysql -u root -p wedding_rsvp < database/phase2_schema.sql
```

### Step 3: Verify Tables

```sql
USE wedding_rsvp;
SHOW TABLES;

-- Should see:
-- admin_users
-- rsvps
-- photos
-- tags
-- photo_tags
-- comments
-- likes
-- videos
-- timeline_events
-- seats
```

---

## Phase 2: API Deployment

### Step 1: Upload API Code to VPS

```bash
# On your local machine
cd api
tar -czf api.tar.gz *

# Upload to VPS
scp api.tar.gz user@your-vps-ip:/var/www/wedding_rsvp/
```

### Step 2: Extract and Install on VPS

```bash
# SSH into VPS
ssh user@your-vps-ip

# Extract
cd /var/www/wedding_rsvp
mkdir -p api
tar -xzf api.tar.gz -C api/
cd api

# Install dependencies
npm install

# Install multer for photo uploads
npm install multer
```

### Step 3: Configure Environment

```bash
# Create .env file
nano .env
```

Add:
```env
PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wedding_rsvp
NODE_ENV=production
```

### Step 4: Create Uploads Directory

```bash
mkdir -p /var/www/wedding_rsvp/uploads/photos
chmod 755 /var/www/wedding_rsvp/uploads
chmod 755 /var/www/wedding_rsvp/uploads/photos
```

### Step 5: Start with PM2

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start API
cd /var/www/wedding_rsvp/api
pm2 start server.js --name wedding-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### Step 6: Configure Nginx

Edit `/etc/nginx/sites-available/jsang-psong-wedding.com`:

```nginx
server {
    listen 80;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;

    # Website (React)
    location / {
        root /var/www/wedding_rsvp/website/dist;
        try_files $uri $uri/ /index.html;
    }

    # API (Node.js)
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files
    location /uploads/ {
        alias /var/www/wedding_rsvp/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3002/health;
    }
}
```

### Step 7: Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Test API

```bash
# Test health check
curl https://jsang-psong-wedding.com/health

# Should return: {"status":"OK","message":"Wedding RSVP API is running"}

# Test get RSVPs (requires admin login first)
curl https://jsang-psong-wedding.com/api/admin/rsvps \
  -H "x-admin-email: angjinsheng@gmail.com" \
  -H "x-admin-id: 1"
```

---

## Phase 3: Mobile App Configuration

### Step 1: Update API URL

Edit `mobile_app/src/config/api.js`:

```javascript
const ENV = {
  dev: {
    apiUrl: 'http://192.168.1.100:3002/api', // For local testing
  },
  staging: {
    apiUrl: 'https://jsang-psong-wedding.com/api',
  },
  prod: {
    apiUrl: 'https://jsang-psong-wedding.com/api', // Production
  },
};
```

### Step 2: Test with Production API

```bash
cd mobile_app
npx expo start
```

- Open app on phone
- Navigate to Settings → API Test
- Run all tests
- Should connect to production API

### Step 3: Build APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android APK
eas build --platform android --profile preview
```

Wait for build to complete (10-20 minutes).

### Step 4: Download and Test

1. Download APK from EAS build link
2. Install on Android device
3. Test all features:
   - RSVP submission
   - Photo viewing
   - Comments
   - Likes
   - Seat map
   - Videos
   - Timeline

### Step 5: Distribute to Guests

**Option A: Google Drive**
1. Upload APK to Google Drive
2. Share link via WhatsApp/WeChat
3. Guests download and install

**Option B: Direct Link**
1. Upload APK to your server
2. Share direct download link
3. Guests download and install

**Option C: QR Code**
1. Generate QR code for download link
2. Print on wedding invitations
3. Guests scan and install

---

## Phase 4: Website Update

The website should already be connecting to the new API. If not:

### Step 1: Verify Website .env

```bash
# On VPS
cat /var/www/wedding_rsvp/website/.env
```

Should have:
```env
VITE_API_URL=https://jsang-psong-wedding.com/api
```

### Step 2: Rebuild Website (if needed)

```bash
cd /var/www/wedding_rsvp/website
npm run build
```

### Step 3: Test Website

Visit https://jsang-psong-wedding.com and test:
- RSVP submission
- Admin login
- Admin dashboard
- All CRUD operations

---

## Verification Checklist

### Database:
- [ ] All tables created
- [ ] Sample data inserted
- [ ] Relationships working

### API:
- [ ] Server running on port 3002
- [ ] Health check returns OK
- [ ] All endpoints working
- [ ] File uploads working
- [ ] CORS enabled

### Nginx:
- [ ] API proxy configured
- [ ] Uploads directory accessible
- [ ] SSL certificate valid
- [ ] No 502/504 errors

### Website:
- [ ] Connects to new API
- [ ] RSVP submission works
- [ ] Admin dashboard works
- [ ] No console errors

### Mobile App:
- [ ] Connects to production API
- [ ] RSVP submission works
- [ ] Photo viewing works
- [ ] All features functional
- [ ] APK installs successfully

---

## Monitoring

### Check API Logs

```bash
# View logs
pm2 logs wedding-api

# View last 100 lines
pm2 logs wedding-api --lines 100

# Monitor in real-time
pm2 monit
```

### Check Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### Check Database

```bash
mysql -u root -p wedding_rsvp

# Check recent RSVPs
SELECT * FROM rsvps ORDER BY created_at DESC LIMIT 10;

# Check photos
SELECT COUNT(*) FROM photos;

# Check comments
SELECT COUNT(*) FROM comments;
```

---

## Backup Strategy

### Database Backup

```bash
# Create backup script
nano /root/backup-wedding-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root wedding_rsvp > /root/backups/wedding_rsvp_$DATE.sql
# Keep only last 7 days
find /root/backups/ -name "wedding_rsvp_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /root/backup-wedding-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-wedding-db.sh
```

### Uploaded Photos Backup

```bash
# Backup uploads directory
tar -czf /root/backups/uploads_$(date +%Y%m%d).tar.gz /var/www/wedding_rsvp/uploads/
```

---

## Troubleshooting

### API Not Responding

```bash
# Check if running
pm2 list

# Restart
pm2 restart wedding-api

# Check logs
pm2 logs wedding-api --err
```

### Database Connection Error

```bash
# Check MySQL is running
systemctl status mysql

# Test connection
mysql -u root -p wedding_rsvp
```

### Photo Upload Fails

```bash
# Check permissions
ls -la /var/www/wedding_rsvp/uploads/

# Fix permissions
chmod 755 /var/www/wedding_rsvp/uploads/
chmod 755 /var/www/wedding_rsvp/uploads/photos/
```

### Mobile App Can't Connect

1. Check API is running: `curl https://jsang-psong-wedding.com/health`
2. Check CORS is enabled in API
3. Verify API URL in mobile app config
4. Check firewall not blocking requests

---

## Performance Optimization

### API:
- Enable gzip compression in Nginx
- Add rate limiting
- Implement caching for photos
- Optimize database queries

### Database:
- Add indexes on frequently queried columns
- Optimize large tables
- Regular maintenance

### Photos:
- Resize images on upload
- Generate thumbnails
- Use CDN (optional)

---

## Security Checklist

- [ ] SSL certificate installed
- [ ] Admin passwords strong
- [ ] Database not exposed publicly
- [ ] API rate limiting enabled
- [ ] File upload size limited
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention
- [ ] CORS properly configured

---

## Cost Estimate

### Current Setup (VPS):
- VPS: $5-20/month (existing)
- Domain: $10-15/year (existing)
- SSL: Free (Let's Encrypt)
- **Total: $0 additional**

### Optional:
- Google Play Store: $25 one-time
- Apple App Store: $99/year
- CDN: $0-10/month
- EAS Pro: $29/month (for unlimited builds)

---

## Post-Deployment Tasks

### Week 1:
- [ ] Monitor API logs daily
- [ ] Check for errors
- [ ] Test all features
- [ ] Get user feedback

### Week 2:
- [ ] Optimize based on usage
- [ ] Add analytics (optional)
- [ ] Improve performance
- [ ] Fix any bugs

### Before Wedding:
- [ ] Test with real users
- [ ] Ensure high availability
- [ ] Have backup plan
- [ ] Monitor closely

### After Wedding:
- [ ] Backup all photos
- [ ] Export guest data
- [ ] Archive database
- [ ] Keep app running for memories

---

## Quick Command Reference

```bash
# Start API
pm2 start wedding-api

# Restart API
pm2 restart wedding-api

# Stop API
pm2 stop wedding-api

# View logs
pm2 logs wedding-api

# Restart Nginx
sudo systemctl restart nginx

# Test Nginx config
sudo nginx -t

# Database backup
mysqldump -u root wedding_rsvp > backup.sql

# Build mobile app
eas build --platform android --profile preview

# Check API health
curl https://jsang-psong-wedding.com/health
```

---

**Status**: Ready for deployment
**Estimated Time**: 2-3 hours total
**Recommended Order**: Database → API → Test → Mobile App → Distribute

