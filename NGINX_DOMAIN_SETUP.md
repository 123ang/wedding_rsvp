# Complete Guide: Linking Your Domain to VPS with Nginx

## Overview
This guide will help you connect `jsang-psong-wedding.com` to your VPS at IP `110.4.47.197` using Nginx.

---

## Step 1: Configure DNS (Point Domain to VPS)

**This is the FIRST step** - Your domain must point to your VPS IP before nginx can work.

### Where to Configure DNS:
- Log into your domain registrar (where you bought `jsang-psong-wedding.com`)
- Find "DNS Management" or "DNS Settings"

### DNS Records to Add/Update:

#### Option A: A Record (Recommended)
```
Type: A
Name: @ (or leave blank, or use "jsang-psong-wedding.com")
Value: 110.4.47.197
TTL: 3600 (or Auto)
```

#### Option B: Also Add www Subdomain
```
Type: A
Name: www
Value: 110.4.47.197
TTL: 3600
```

### Verify DNS Propagation:
After adding DNS records, wait 5-60 minutes, then check:

**On Windows (PowerShell):**
```powershell
nslookup jsang-psong-wedding.com
```

**On Linux/Mac:**
```bash
dig jsang-psong-wedding.com
# or
nslookup jsang-psong-wedding.com
```

You should see `110.4.47.197` in the response.

**Online Tools:**
- https://dnschecker.org
- https://www.whatsmydns.net

---

## Step 2: Connect to Your VPS

**On Windows (PowerShell or Command Prompt):**
```powershell
ssh root@110.4.47.197
# or if you have a username:
ssh username@110.4.47.197
```

**On Linux/Mac:**
```bash
ssh root@110.4.47.197
```

If this is your first time connecting, you'll be asked to accept the server's fingerprint.

---

## Step 3: Install Nginx on VPS

Once connected to your VPS, run:

### For Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install nginx
sudo apt install nginx -y

# Start nginx
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### For CentOS/RHEL:
```bash
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Verify Nginx is Running:
```bash
# Check if nginx is listening on port 80
sudo netstat -tulpn | grep :80
# or
sudo ss -tulpn | grep :80
```

You should see nginx listening on port 80.

**Test:** Visit `http://110.4.47.197` in your browser - you should see the default nginx welcome page.

---

## Step 4: Create Website Directory

**Note:** Since you're using Supabase (not PHP/MySQL), you don't need to install PHP or MySQL on your VPS. The frontend connects directly to Supabase's cloud database.

```bash
# Create directory for your website
sudo mkdir -p /var/www/jsang-psong-wedding.com

# Set ownership (www-data is the web server user on Ubuntu/Debian)
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com

# Set permissions
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

---

## Step 5: Deploy Your Website Files

Since you've already cloned to `/root/projects/wedding_rsvp`, here's how to deploy:

### Option A: Build and Copy from Git Repository (Recommended)

**On your VPS:**

```bash
# Navigate to your git repository
cd /root/projects/wedding_rsvp

# Pull latest changes (if needed)
git pull

# Build the frontend for production
npm run build

# Copy built files to web directory
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/

# Copy API folder
sudo cp -r api /var/www/jsang-psong-wedding.com/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

### Option B: Create Deployment Script

Create a deployment script for easy updates:

```bash
# Create deployment script
nano /root/projects/wedding_rsvp/deploy.sh
```

**Paste this content:**
```bash
#!/bin/bash
set -e

echo "Deploying wedding RSVP website..."

# Navigate to project
cd /root/projects/wedding_rsvp

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Build frontend
echo "Building frontend..."
npm run build

# Copy files to web directory
echo "Copying files to web directory..."
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/
sudo cp -r api /var/www/jsang-psong-wedding.com/

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
```

**Make it executable:**
```bash
chmod +x /root/projects/wedding_rsvp/deploy.sh
```

**Run it:**
```bash
/root/projects/wedding_rsvp/deploy.sh
```

### Option C: Using SCP (from your local Windows machine)

If you prefer to build locally and upload:

**In PowerShell on your Windows computer:**
```powershell
# Navigate to your project folder
cd C:\Users\User\Desktop\Website\wedding_rsvp

# Build first
npm run build

# Upload dist folder contents
scp -r dist/* root@110.4.47.197:/var/www/jsang-psong-wedding.com/

# Upload api folder
scp -r api root@110.4.47.197:/var/www/jsang-psong-wedding.com/
```

### Option D: Using SFTP Client (WinSCP, FileZilla)
- Host: `110.4.47.197`
- Username: `root` (or your username)
- Port: `22`
- Upload `dist/*` contents to `/var/www/jsang-psong-wedding.com/`
- Upload `api/` folder to `/var/www/jsang-psong-wedding.com/api/`

---

## Step 6: Configure Nginx for Your Domain

Create nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;  # IPv6 support
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/jsang-psong-wedding.com.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.com.error.log;
    
    # Frontend - React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Note: No PHP/API needed - frontend connects directly to Supabase
    
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
}
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter`

**Note:** Since you're using Supabase, no PHP configuration is needed. The frontend connects directly to Supabase's cloud API.

---

## Step 7: Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

## Step 8: Set File Permissions

**Note:** Since you're using Supabase, you don't need to set up MySQL database on your VPS. Your data is stored in Supabase's cloud database.

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com

# Set directory permissions
sudo find /var/www/jsang-psong-wedding.com -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/jsang-psong-wedding.com -type f -exec chmod 644 {} \;

# Make sure PHP can write if needed (for logs, etc.)
sudo chmod -R 775 /var/www/jsang-psong-wedding.com/api
```

---

## Step 9: Install SSL Certificate (HTTPS)

### Install Certbot:
```bash
# For Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate:
```bash
# This will automatically configure nginx for HTTPS
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Auto-Renewal:
Certbot sets up auto-renewal automatically. Test it:
```bash
sudo certbot renew --dry-run
```

---

## Step 10: Verify Supabase Configuration

Make sure your Supabase configuration is correct in your frontend code:

**File: `src/config/supabase.js`** should have your Supabase URL and API key:
```javascript
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

The frontend will connect directly to Supabase - no server-side API needed!

---

## Step 11: Update Frontend Configuration (if needed)

**On your VPS**, before building:

1. Verify Supabase config in `src/config/supabase.js` is correct

2. Build the frontend:
```bash
cd /root/projects/wedding_rsvp
npm run build
```

3. Deploy:
```bash
./deploy.sh
# or manually:
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
```

---

## Step 12: Test Your Website

1. **Test HTTP (should redirect to HTTPS):**
   - Visit: `http://jsang-psong-wedding.com`

2. **Test HTTPS:**
   - Visit: `https://jsang-psong-wedding.com`

3. **Test Routes:**
   - `https://jsang-psong-wedding.com/bride/en`
   - `https://jsang-psong-wedding.com/groom/en`
   - `https://jsang-psong-wedding.com/admin/login`

4. **Test API:**
   - Open browser DevTools > Network tab
   - Submit an RSVP
   - Check if API calls work

---

## Troubleshooting

### Check Nginx Status:
```bash
sudo systemctl status nginx
```

### Check Nginx Error Logs:
```bash
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log
```

### Test Nginx Configuration:
```bash
sudo nginx -t
```

### Reload Nginx:
```bash
sudo systemctl reload nginx
```

### Common Issues:

**1. 404 Not Found:**
- Check file paths in nginx config
- Verify files are uploaded correctly
- Check file permissions

**2. CORS Errors (if accessing Supabase):**
- Supabase handles CORS automatically, but if you encounter issues:
  - Check Supabase project settings for allowed origins
  - Verify your Supabase URL and API key are correct
  - Check browser console for specific CORS error messages

**3. DNS Not Working:**
- Wait longer (can take up to 48 hours, usually 5-60 minutes)
- Check DNS propagation: https://dnschecker.org
- Verify DNS records are correct

---

## Quick Reference Commands

```bash
# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t

# PHP-FPM
sudo systemctl status php8.1-fpm
sudo systemctl restart php8.1-fpm

# MySQL
sudo systemctl status mysql
sudo systemctl restart mysql

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log
sudo tail -f /var/log/php8.1-fpm.log

# File permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

---

## Summary Checklist

- [ ] DNS A record points to `110.4.47.197`
- [ ] Nginx installed and running
- [ ] Website files uploaded to `/var/www/jsang-psong-wedding.com`
- [ ] Nginx configuration created and enabled
- [ ] File permissions set correctly
- [ ] SSL certificate installed (HTTPS)
- [ ] Supabase configuration verified in `src/config/supabase.js`
- [ ] Website tested and working

---

## Next Steps

After everything is working:
1. Set up automatic backups
2. Configure firewall (UFW): `sudo ufw allow 'Nginx Full'`
3. Monitor server logs regularly
4. Keep software updated: `sudo apt update && sudo apt upgrade`

---

## Need Help?

If something doesn't work:
1. Check the error logs first
2. Verify each step was completed
3. Test with `curl` from VPS: `curl http://localhost`
4. Check firewall settings

Good luck! 🎉

