# Step-by-Step Nginx Setup Guide

Since you already have nginx installed, follow these steps:

## Step 1: Create Website Directory

```bash
sudo mkdir -p /var/www/jsang-psong-wedding.com
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

## Step 2: Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    access_log /var/log/nginx/jsang-psong-wedding.com.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.com.error.log;
    
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
}
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter`

## Step 3: Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-enabled/

# Remove default nginx site (optional but recommended)
sudo rm /etc/nginx/sites-enabled/default
```

## Step 4: Test Nginx Configuration

```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If you see errors, check the configuration file again.

## Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
```

## Step 6: Verify It's Working

```bash
# Check nginx status
sudo systemctl status nginx

# Test from VPS
curl http://localhost

# Or visit in browser
# http://110.4.47.197 (before DNS)
# http://jsang-psong-wedding.com (after DNS is configured)
```

## Step 7: Deploy Your Website Files

```bash
cd /root/projects/wedding_rsvp

# Build frontend
npm run build

# Copy to web directory
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/

# Set permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

## Step 8: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended: Yes)

## Files You Need to Edit

### 1. Nginx Configuration (Main file)
```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```
This is the main configuration file for your website.

### 2. Main Nginx Config (Usually don't need to edit)
```bash
sudo nano /etc/nginx/nginx.conf
```
Only edit this if you need to change global nginx settings.

## Common Commands

```bash
# Test configuration
sudo nginx -t

# Reload nginx (no downtime)
sudo systemctl reload nginx

# Restart nginx (brief downtime)
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# View access logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.access.log
```

## Troubleshooting

### If nginx -t fails:
1. Check the configuration file for typos
2. Make sure all brackets `{}` are closed
3. Check for missing semicolons `;`

### If site doesn't load:
1. Check files are in `/var/www/jsang-psong-wedding.com/`
2. Check file permissions: `ls -la /var/www/jsang-psong-wedding.com/`
3. Check nginx is running: `sudo systemctl status nginx`
4. Check error logs: `sudo tail -20 /var/log/nginx/jsang-psong-wedding.com.error.log`

### If you see 404 errors:
- Make sure `index.html` exists in `/var/www/jsang-psong-wedding.com/`
- Check the `root` path in nginx config is correct
- Verify React Router `try_files` directive is present

## Summary

**Files to edit:**
1. ✅ `/etc/nginx/sites-available/jsang-psong-wedding.com` - Your website config

**Commands to run:**
1. ✅ `sudo ln -s /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-enabled/` - Enable site
2. ✅ `sudo nginx -t` - Test config
3. ✅ `sudo systemctl reload nginx` - Apply changes

That's it! 🎉



