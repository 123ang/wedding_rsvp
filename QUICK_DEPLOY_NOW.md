# Quick Deployment Guide - You're on VPS Now

## Current Status
✅ Nginx config is already set up
❌ API not running (that's why `/api/health` returns "Route not found")
❌ Website not built/deployed

---

## Step 1: Build Website (On VPS)

You're currently at `/root/projects/wedding_rsvp`. Run:

```bash
# Navigate to website folder
cd website

# Install dependencies (first time only)
npm install

# Build for production
npm run build
```

This creates a `dist/` folder.

---

## Step 2: Copy Website Files to Web Directory

```bash
# Copy all files from dist to web directory
cp -r dist/* /var/www/jsang-psong-wedding.com/

# Set permissions
chown -R www-data:www-data /var/www/jsang-psong-wedding.com
chmod -R 755 /var/www/jsang-psong-wedding.com
```

---

## Step 3: Set Up and Start Node.js API

```bash
# Navigate to API folder
cd /root/projects/wedding_rsvp/api

# Install dependencies
npm install

# Create .env file
nano .env
```

**Add this to `.env`:**
```env
PORT=3002
DB_HOST=localhost
DB_USER=wedding_user
DB_PASSWORD=your_database_password_here
DB_NAME=wedding_rsvp
NODE_ENV=production
```

**Save and exit** (Ctrl+X, then Y, then Enter)

---

## Step 4: Create Database and User (If Not Done)

```bash
# Connect to MySQL
mysql -u root -p

# Run this SQL (replace password!)
CREATE DATABASE IF NOT EXISTS wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'wedding_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Update the `.env` file** with the same password you just set.

---

## Step 5: Create Database Tables

```bash
# Run the schema files
mysql -u wedding_user -p wedding_rsvp < /root/projects/wedding_rsvp/database/create_tables.sql
mysql -u wedding_user -p wedding_rsvp < /root/projects/wedding_rsvp/database/phase2_schema.sql
```

---

## Step 6: Create Uploads Directory

```bash
# Create directory for uploaded photos
mkdir -p /root/projects/wedding_rsvp/uploads/photos
chmod -R 755 /root/projects/wedding_rsvp/uploads
```

---

## Step 7: Start API with PM2

```bash
# Install PM2 (if not installed)
npm install -g pm2

# Start the API
cd /root/projects/wedding_rsvp/api
pm2 start server.js --name wedding-api

# Save PM2 config
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

---

## Step 8: Update Nginx Config (Add Health Check)

Your Nginx config is good, but let's add the health check route:

```bash
# Edit Nginx config
nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

**Add this BEFORE the `/api/` location block:**
```nginx
    # Health check
    location /health {
        proxy_pass http://localhost:3002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
```

**Also add uploads location (if not there):**
```nginx
    # Uploaded files
    location /uploads/ {
        alias /root/projects/wedding_rsvp/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
```

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 9: Test Everything

### Test API directly:
```bash
curl http://localhost:3002/health
# Should return: {"status":"OK","message":"Wedding RSVP API is running"}
```

### Test through Nginx:
```bash
curl https://jsang-psong-wedding.com/health
# Should return the same
```

### Test API endpoint:
```bash
curl https://jsang-psong-wedding.com/api/admin/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"angjinsheng@gmail.com","password":"920214"}'
```

### Test Website:
1. Visit: `https://jsang-psong-wedding.com`
2. Should see the wedding website
3. Try submitting an RSVP

---

## Quick Command Summary

```bash
# 1. Build website
cd /root/projects/wedding_rsvp/website
npm install
npm run build

# 2. Deploy website
cp -r dist/* /var/www/jsang-psong-wedding.com/
chown -R www-data:www-data /var/www/jsang-psong-wedding.com

# 3. Set up API
cd /root/projects/wedding_rsvp/api
npm install
nano .env  # Add database credentials

# 4. Create database (if needed)
mysql -u root -p < /root/projects/wedding_rsvp/database/quick_setup.sql

# 5. Create tables
mysql -u wedding_user -p wedding_rsvp < /root/projects/wedding_rsvp/database/create_tables.sql
mysql -u wedding_user -p wedding_rsvp < /root/projects/wedding_rsvp/database/phase2_schema.sql

# 6. Create uploads directory
mkdir -p /root/projects/wedding_rsvp/uploads/photos

# 7. Start API
npm install -g pm2
pm2 start server.js --name wedding-api
pm2 save
pm2 startup

# 8. Test
curl http://localhost:3002/health
curl https://jsang-psong-wedding.com/health
```

---

## Troubleshooting

### API Still Returns "Route not found"

**Check:**
```bash
# Is API running?
pm2 list

# Check API logs
pm2 logs wedding-api

# Test API directly
curl http://localhost:3002/health
```

**If not running:**
```bash
cd /root/projects/wedding_rsvp/api
pm2 start server.js --name wedding-api
pm2 logs wedding-api
```

### Database Connection Error

**Check:**
```bash
# Test database connection
mysql -u wedding_user -p wedding_rsvp

# If fails, check user exists
mysql -u root -p
SELECT user, host FROM mysql.user WHERE user='wedding_user';
```

**Fix:**
```bash
mysql -u root -p
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

### Website Shows 404

**Check:**
```bash
# Are files there?
ls /var/www/jsang-psong-wedding.com/

# Is index.html there?
ls /var/www/jsang-psong-wedding.com/index.html
```

**Fix:**
```bash
cd /root/projects/wedding_rsvp/website
npm run build
cp -r dist/* /var/www/jsang-psong-wedding.com/
```

---

## Verify Deployment

✅ API health check works: `curl https://jsang-psong-wedding.com/health`
✅ Website loads: Visit `https://jsang-psong-wedding.com`
✅ RSVP submission works
✅ Admin login works: `https://jsang-psong-wedding.com/admin/login`

---

**Next**: Run the commands above in order!

