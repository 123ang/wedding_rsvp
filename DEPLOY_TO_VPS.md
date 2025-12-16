# Deploy Wedding RSVP to VPS

## Directory Structure on VPS

After deployment, your VPS should have this structure:

```
/var/www/jsang-psong-wedding.com/
├── index.html
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
├── favicon.png
├── photos/
│   ├── bride/
│   ├── groom/
│   └── [other photos]
├── music/
│   └── wedding_music.mp3
└── api/
    ├── bride-rsvp.php
    ├── groom-rsvp.php
    ├── config/
    │   └── database.php
    └── admin/
        ├── login.php
        ├── logout.php
        ├── check-auth.php
        ├── get-rsvps.php
        └── update-payment.php
```

## Deployment Steps

### 1. Build Frontend for Production

```bash
npm run build
```

This creates a `dist/` folder with all frontend files.

### 2. Upload to VPS

Upload these to your VPS `/var/www/jsang-psong-wedding.com/`:

**Option A: Manual Upload**
- Upload everything from `dist/` folder
- Upload the `api/` folder to `dist/api/`

**Option B: Using SCP**
```bash
# Upload dist contents
scp -r dist/* user@your-vps:/var/www/jsang-psong-wedding.com/

# Upload api folder
scp -r api user@your-vps:/var/www/jsang-psong-wedding.com/
```

### 3. Update API Configuration

Edit `/var/www/jsang-psong-wedding.com/api/config/database.php`:

```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "wedding_rsvp";
    private $username = "your_db_username";
    private $password = "your_db_password";
    private $conn;
    
    // ... rest of the code
}
```

### 4. Create Database

Run `database/schema.sql` on your MySQL server:

```bash
mysql -u root -p < database/schema.sql
```

### 5. Configure Nginx

Edit `/etc/nginx/sites-available/jsang-psong-wedding.com`:

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
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
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
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Update Frontend API URL

Before building, update `src/config/constants.js`:

```javascript
const API_CONFIG = {
  DEV_API_URL: '/api',
  PROD_API_URL: 'https://jsang-psong-wedding.com/api', // Change to your domain
  getBaseURL: () => {
    if (import.meta.env.PROD) {
      return API_CONFIG.PROD_API_URL;
    }
    return API_CONFIG.DEV_API_URL;
  }
};
```

Then rebuild: `npm run build`

### 7. Set File Permissions

```bash
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

### 8. Enable SSL (HTTPS) with Let's Encrypt

```bash
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

## Quick Deployment Script

Create a `deploy.sh` in your project root:

```bash
#!/bin/bash

echo "Building frontend..."
npm run build

echo "Uploading to VPS..."
scp -r dist/* /var/www/jsang-psong-wedding.com/
scp -r api user@your-vps:/var/www/jsang-psong-wedding.com/

echo "Setting permissions..."
ssh user@your-vps "sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com"
ssh user@your-vps "sudo chmod -R 755 /var/www/jsang-psong-wedding.com"

echo "Deployment complete!"
```

Make it executable: `chmod +x deploy.sh`

Run it: `./deploy.sh`

## Verify Deployment

1. Visit `http://jsang-psong-wedding.com`
2. Test RSVP submission
3. Visit `http://jsang-psong-wedding.com/admin/login`
4. Login with admin credentials
5. Verify data is saved to database

## Troubleshooting

- **404 errors**: Check Nginx rewrite rules (try_files directive)
- **API not working**: Check PHP-FPM is installed and running
- **Database connection error**: Verify database credentials in `api/config/database.php`
- **CORS errors**: Check Nginx headers configuration

## Notes

- Use the production API URL in `constants.js` before building
- Make sure PHP version is 7.4 or higher
- Enable required PHP extensions: `php-mysql`, `php-json`, `php-mbstring`
- Configure Nginx `try_files` for React Router SPA routing
- Ensure PHP-FPM service is running: `sudo systemctl status php8.1-fpm`
