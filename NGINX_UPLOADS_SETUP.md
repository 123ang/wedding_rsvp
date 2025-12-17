# Nginx Configuration for Uploads Directory

## Problem
Getting `404 Not Found` for image URLs like `https://jsang-psong-wedding.com/uploads/photos/photo-123.jpg`

## Solution

### Step 1: Find Your Nginx Configuration File

On your VPS, find your nginx site configuration:
```bash
# Usually one of these:
/etc/nginx/sites-available/jsang-psong-wedding.com
/etc/nginx/sites-available/default
/etc/nginx/nginx.conf
```

### Step 2: Add Uploads Location Block

Add this configuration **BEFORE** your `/api` location block:

```nginx
# Serve uploads directly from filesystem (FASTER)
location /uploads {
    alias /path/to/your/wedding_rsvp/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
    
    # Security: Only allow image and video files
    location ~* \.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$ {
        add_header Access-Control-Allow-Origin *;
    }
    
    # Deny access to other file types
    location ~* \.(php|sh|exe|bat)$ {
        deny all;
    }
}
```

**Important:** Replace `/path/to/your/wedding_rsvp/uploads` with your actual path!

To find your actual path:
```bash
cd /path/to/your/api
pwd  # This shows your API directory
# Uploads should be at: /path/to/your/api/../uploads
# Or check: ls -la /path/to/your/api/../uploads
```

### Step 3: Set Correct Permissions

Make sure nginx can read the uploads directory:
```bash
# Replace with your actual uploads path
UPLOADS_PATH="/path/to/your/wedding_rsvp/uploads"

# Set ownership (nginx user is usually 'www-data' or 'nginx')
sudo chown -R www-data:www-data $UPLOADS_PATH

# Set permissions
sudo chmod -R 755 $UPLOADS_PATH

# For photos subdirectory
sudo chmod -R 755 $UPLOADS_PATH/photos
sudo chmod -R 755 $UPLOADS_PATH/videos
```

### Step 4: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
# OR
sudo service nginx reload
```

### Step 5: Verify It Works

Test in browser:
- `https://jsang-psong-wedding.com/uploads/photos/photo-123.jpg`
- Should show the image (not 404)

## Alternative: Proxy Through Node.js

If direct filesystem serving doesn't work, you can proxy through Node.js:

```nginx
location /uploads {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Troubleshooting

### Still getting 404?
1. Check the path is correct: `ls -la /path/to/your/wedding_rsvp/uploads/photos`
2. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Check file permissions: `ls -la /path/to/your/wedding_rsvp/uploads/photos/`
4. Verify nginx can read: `sudo -u www-data cat /path/to/your/wedding_rsvp/uploads/photos/some-photo.jpg`

### Permission Denied?
```bash
# Make sure nginx user can read
sudo chmod -R 755 /path/to/your/wedding_rsvp/uploads
sudo chown -R www-data:www-data /path/to/your/wedding_rsvp/uploads
```

### Files not found?
- Check if files actually exist: `ls -la /path/to/your/wedding_rsvp/uploads/photos/`
- Check the image_url in database matches the actual filename

