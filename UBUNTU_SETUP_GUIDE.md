# Complete Setup Guide for Ubuntu 24.04 VPS

This guide will walk you through setting up your VPS from scratch to run the Wedding RSVP website.

## Prerequisites

- A VPS running Ubuntu 24.04
- Root or sudo access
- Your domain name pointing to the VPS IP address

---

## Part 1: Initial Server Setup

### Step 1: Connect to Your VPS

Open your terminal (Windows: PowerShell or CMD, Mac/Linux: Terminal) and connect:

```bash
ssh root@your-vps-ip-address
```

Or if using a username:
```bash
ssh username@your-vps-ip-address
```

### Step 2: Update the System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3: Create a Non-Root User (Recommended)

```bash
adduser yourusername
usermod -aG sudo yourusername
```

Replace `yourusername` with your desired username.

### Step 4: Logout and Login with New User

```bash
exit
ssh yourusername@your-vps-ip-address
```

---

## Part 2: Install Required Software

### Step 5: Install Nginx Web Server

```bash
sudo apt install nginx -y
```

Start and enable Nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Check if Nginx is running:
```bash
sudo systemctl status nginx
```

Test by visiting `http://your-vps-ip-address` in your browser.

### Step 6: Install PHP and PHP-FPM

```bash
sudo apt install php php-fpm php-mysql php-mbstring php-xml php-curl -y
```

Check PHP version:
```bash
php -v
```

You should see version 8.1 or higher.

### Step 7: Install MySQL Database

```bash
sudo apt install mysql-server -y
```

Secure MySQL installation:
```bash
sudo mysql_secure_installation
```

**Answer these questions:**
- Press Enter for no password (Ubuntu 24.04 uses auth_socket)
- Type `Y` to use password authentication
- Set a strong password (write it down!)
- Press Enter for other questions (default is Y)

### Step 8: Create Database

Login to MySQL:
```bash
sudo mysql -u root -p
```

Then run these SQL commands:

```sql
CREATE DATABASE wedding_rsvp;
CREATE USER 'wedding_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Replace `your_strong_password_here` with a strong password and write it down!**

---

## Part 3: Prepare Website Directory

### Step 9: Create Website Directory

```bash
sudo mkdir -p /var/www/jsang-psong-wedding.com
sudo chown -R $USER:$USER /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

### Step 10: Upload Website Files

You have two options:

#### Option A: Using SCP (from your local computer)

From your local computer (not on VPS), run:

```bash
# Navigate to your project folder
cd wedding_rsvp

# Build the frontend
npm run build

# Upload dist folder contents
scp -r dist/* yourusername@your-vps-ip:/var/www/jsang-psong-wedding.com/

# Upload API folder
scp -r api yourusername@your-vps-ip:/var/www/jsang-psong-wedding.com/
```

#### Option B: Manual Upload (using FTP or file manager)

1. Build the frontend locally: `npm run build`
2. Upload everything from the `dist/` folder to `/var/www/jsang-psong-wedding.com/`
3. Upload the `api/` folder to `/var/www/jsang-psong-wedding.com/`

### Step 11: Set Correct Permissions

After uploading, run on VPS:

```bash
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

---

## Part 4: Configure Database

### Step 12: Import Database Schema

On your local computer, upload `database/schema.sql` to the VPS:

```bash
# From local computer
scp database/schema.sql yourusername@your-vps-ip:~/
```

Then on the VPS:

```bash
mysql -u wedding_user -p wedding_rsvp < ~/schema.sql
```

Enter the password you set earlier.

### Step 13: Configure Database Connection

Edit the database configuration file:

```bash
sudo nano /var/www/jsang-psong-wedding.com/api/config/database.php
```

Update these lines with your credentials:

```php
private $host = "localhost";
private $db_name = "wedding_rsvp";
private $username = "wedding_user";
private $password = "your_strong_password_here";
```

Save and exit: `Ctrl + X`, then `Y`, then `Enter`

---

## Part 5: Configure Nginx

### Step 14: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    root /var/www/jsang-psong-wedding.com;
    index index.html;

    # Frontend (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP API
    location /api {
        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/jsang-psong-wedding.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.error.log;
}
```

Save and exit: `Ctrl + X`, then `Y`, then `Enter`

### Step 15: Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-enabled/
```

Remove default site (optional):
```bash
sudo rm /etc/nginx/sites-enabled/default
```

Test Nginx configuration:
```bash
sudo nginx -t
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## Part 6: Setup SSL (HTTPS)

### Step 16: Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 17: Get SSL Certificate

Make sure your domain is pointing to the VPS IP first!

```bash
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

Follow the prompts:
- Enter your email address
- Agree to terms: Type `A` then `Y`
- Share email: Type `Y` or `N`
- Certbot will automatically configure HTTPS

Test automatic renewal:
```bash
sudo certbot renew --dry-run
```

---

## Part 7: Update Frontend API URL

### Step 18: Update Constants File

Before building, update `src/config/constants.js` on your local computer:

```javascript
const API_CONFIG = {
  DEV_API_URL: '/api',
  PROD_API_URL: 'https://jsang-psong-wedding.com/api',  // Your actual domain
  getBaseURL: () => {
    if (import.meta.env.PROD) {
      return API_CONFIG.PROD_API_URL;
    }
    return API_CONFIG.DEV_API_URL;
  }
};
```

Then rebuild and re-upload:
```bash
npm run build
scp -r dist/* yourusername@your-vps-ip:/var/www/jsang-psong-wedding.com/
```

---

## Part 8: Verify Everything Works

### Step 19: Test the Website

1. Visit `https://jsang-psong-wedding.com`
2. Try submitting an RSVP
3. Visit `https://jsang-psong-wedding.com/admin/login`
4. Login with admin credentials:
   - Email: `angjinsheng@gmail.com`
   - Password: `920214`
   OR
   - Email: `psong32@hotmail.com`
   - Password: `921119`

### Step 20: Common Issues and Fixes

**Issue: 404 Error on pages**
```bash
# Check Nginx is running
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.error.log
```

**Issue: PHP not working**
```bash
# Check PHP-FPM status
sudo systemctl status php8.3-fpm

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm

# Test PHP
echo "<?php phpinfo(); ?>" > /var/www/jsang-psong-wedding.com/test.php
# Visit https://jsang-psong-wedding.com/test.php (then delete it)
```

**Issue: Database connection error**
```bash
# Test MySQL connection
mysql -u wedding_user -p wedding_rsvp

# Check if tables exist
USE wedding_rsvp;
SHOW TABLES;
```

**Issue: Permission denied**
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

---

## Part 9: Maintenance Commands

### Useful Commands

View Nginx logs:
```bash
sudo tail -f /var/log/nginx/jsang-psong-wedding.error.log
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.3-fpm
```

Check disk space:
```bash
df -h
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Summary Checklist

- [ ] Connected to VPS via SSH
- [ ] Updated system packages
- [ ] Installed Nginx
- [ ] Installed PHP and PHP-FPM
- [ ] Installed MySQL
- [ ] Created database and user
- [ ] Uploaded website files
- [ ] Imported database schema
- [ ] Configured database connection
- [ ] Created Nginx configuration
- [ ] Enabled SSL with Certbot
- [ ] Updated API URL in constants.js
- [ ] Tested website functionality

## Next Steps

1. Test all website features
2. Update admin passwords
3. Set up automated backups
4. Monitor server logs regularly

## Get Help

If you encounter issues:
1. Check the error logs
2. Verify all services are running
3. Double-check file permissions
4. Make sure domain DNS is pointing correctly

**You're all set! Your wedding website is now live! 🎉**

