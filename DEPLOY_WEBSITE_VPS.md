# Deploy Website to VPS - Step by Step Guide

## Current Situation
- You're on VPS at `/root/projects/wedding_rsvp`
- Website code is in `website/` folder
- API is Node.js (not PHP anymore)
- Need to build and deploy both

---

## Step 1: Build the Website

### On Your Local Machine:

```bash
# Navigate to website folder
cd website

# Install dependencies (if not done)
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with production files.

---

## Step 2: Upload Website to VPS

### Option A: From Local Machine (Recommended)

```bash
# From your local machine, in the wedding_rsvp directory
cd website

# Build first
npm run build

# Upload dist folder to VPS
scp -r dist/* root@jsang-psong-wedding.com:/var/www/jsang-psong-wedding.com/

# Or if you have a different user
scp -r dist/* user@jsang-psong-wedding.com:/var/www/jsang-psong-wedding.com/
```

### Option B: Build on VPS

```bash
# SSH into VPS
ssh root@jsang-psong-wedding.com

# Navigate to project
cd /root/projects/wedding_rsvp/website

# Install dependencies
npm install

# Build
npm run build

# Copy to web directory
cp -r dist/* /var/www/jsang-psong-wedding.com/
```

---

## Step 3: Deploy Node.js API

The API is now Node.js, not PHP. Deploy it:

### On VPS:

```bash
# Navigate to API folder
cd /root/projects/wedding_rsvp/api

# Install dependencies
npm install

# Create .env file
nano .env
```

Add this to `.env`:
```env
PORT=3002
DB_HOST=localhost
DB_USER=wedding_user
DB_PASSWORD=your_password_here
DB_NAME=wedding_rsvp
NODE_ENV=production
```

### Start API with PM2:

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start API
pm2 start server.js --name wedding-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

---

## Step 4: Update Nginx Configuration

Edit `/etc/nginx/sites-available/jsang-psong-wedding.com`:

```nginx
server {
    listen 80;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;

    # Website (React)
    root /var/www/jsang-psong-wedding.com;
    index index.html;

    # Frontend routes (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Node.js API
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

    # Health check
    location /health {
        proxy_pass http://localhost:3002/health;
    }

    # Uploaded files (for photos)
    location /uploads/ {
        alias /root/projects/wedding_rsvp/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Test and Reload Nginx:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 5: Create Uploads Directory

```bash
# Create uploads directory for photos
mkdir -p /root/projects/wedding_rsvp/uploads/photos
chmod -R 755 /root/projects/wedding_rsvp/uploads
```

---

## Step 6: Set File Permissions

```bash
# Website files
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# API files (optional, for security)
sudo chown -R root:root /root/projects/wedding_rsvp/api
sudo chmod -R 755 /root/projects/wedding_rsvp/api
```

---

## Step 7: Test Everything

### Test API Health:
```bash
curl http://localhost:3002/health
# Should return: {"status":"OK","message":"Wedding RSVP API is running"}

curl https://jsang-psong-wedding.com/health
# Should return the same
```

### Test API Endpoint:
```bash
curl https://jsang-psong-wedding.com/api/admin/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"angjinsheng@gmail.com","password":"920214"}'
```

### Test Website:
1. Visit: `https://jsang-psong-wedding.com`
2. Try submitting an RSVP
3. Visit: `https://jsang-psong-wedding.com/admin/login`
4. Login and check dashboard

---

## Quick Deployment Commands

### Build and Deploy Website (from local machine):

```bash
# Build
cd website
npm run build

# Upload
scp -r dist/* root@jsang-psong-wedding.com:/var/www/jsang-psong-wedding.com/
```

### Deploy API (on VPS):

```bash
cd /root/projects/wedding_rsvp/api
npm install
pm2 restart wedding-api
pm2 logs wedding-api
```

---

## Troubleshooting

### API Returns "Route not found"

**Check:**
1. Is API running? `pm2 list`
2. Is API on correct port? Check `.env` file
3. Is Nginx proxying correctly? Check `/etc/nginx/sites-available/jsang-psong-wedding.com`
4. Test directly: `curl http://localhost:3002/health`

**Fix:**
```bash
# Check PM2
pm2 list
pm2 logs wedding-api

# Restart API
pm2 restart wedding-api

# Check Nginx config
sudo nginx -t
sudo systemctl reload nginx
```

### Website Shows Blank Page

**Check:**
1. Are files in correct location? `ls /var/www/jsang-psong-wedding.com/`
2. Is index.html there? `ls /var/www/jsang-psong-wedding.com/index.html`
3. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

**Fix:**
```bash
# Re-upload files
cd /root/projects/wedding_rsvp/website
npm run build
cp -r dist/* /var/www/jsang-psong-wedding.com/
```

### Database Connection Error

**Check:**
1. Database exists: `mysql -u root -p -e "SHOW DATABASES LIKE 'wedding_rsvp';"`
2. User exists: `mysql -u root -p -e "SELECT user FROM mysql.user WHERE user='wedding_user';"`
3. Credentials in `.env` are correct

**Fix:**
```bash
# Test connection
mysql -u wedding_user -p wedding_rsvp

# If fails, check user permissions
mysql -u root -p
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Complete Deployment Checklist

- [ ] Build website: `cd website && npm run build`
- [ ] Upload dist files to `/var/www/jsang-psong-wedding.com/`
- [ ] Install API dependencies: `cd api && npm install`
- [ ] Create API `.env` file with database credentials
- [ ] Start API with PM2: `pm2 start server.js --name wedding-api`
- [ ] Update Nginx config to proxy `/api/` to `localhost:3002`
- [ ] Create uploads directory: `mkdir -p uploads/photos`
- [ ] Set file permissions
- [ ] Test API: `curl http://localhost:3002/health`
- [ ] Test website: Visit `https://jsang-psong-wedding.com`
- [ ] Test RSVP submission
- [ ] Test admin login

---

## Directory Structure on VPS (After Deployment)

```
/var/www/jsang-psong-wedding.com/          # Website files
├── index.html
├── assets/
└── ...

/root/projects/wedding_rsvp/
├── website/                                # Source code
│   ├── src/
│   ├── dist/                               # Built files (upload to /var/www)
│   └── package.json
├── api/                                    # Node.js API
│   ├── server.js
│   ├── routes/
│   ├── .env                                # Database config
│   └── package.json
└── uploads/                                 # Uploaded photos
    └── photos/
```

---

## Next Steps After Deployment

1. **Set up SSL** (if not already):
   ```bash
   sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
   ```

2. **Set up database backups** (see `database/SETUP_DATABASE_VPS.md`)

3. **Monitor API logs**:
   ```bash
   pm2 logs wedding-api
   ```

4. **Set up auto-restart** (already done with `pm2 startup`)

---

**Status**: Ready to deploy
**Time**: 15-20 minutes
**Difficulty**: Easy

