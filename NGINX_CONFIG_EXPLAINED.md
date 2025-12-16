# Nginx Configuration Explained

## Complete Nginx Config for Wedding RSVP

This configuration handles:
- ✅ Website (React SPA)
- ✅ Node.js API (port 3002)
- ✅ Health check endpoint
- ✅ File uploads (photos)
- ✅ SSL/HTTPS
- ✅ CORS headers
- ✅ Security headers
- ✅ Static file caching

---

## Key Sections

### 1. Health Check
```nginx
location /health {
    proxy_pass http://localhost:3002/health;
}
```
- Tests if API is running
- Accessible at: `https://jsang-psong-wedding.com/health`

### 2. Uploads Directory
```nginx
location /uploads/ {
    alias /root/projects/wedding_rsvp/uploads/;
}
```
- Serves uploaded photos
- Accessible at: `https://jsang-psong-wedding.com/uploads/photos/photo.jpg`

### 3. API Proxy
```nginx
location /api/ {
    proxy_pass http://localhost:3002/api/;
}
```
- Proxies all `/api/*` requests to Node.js API
- Includes CORS headers for cross-origin requests

### 4. Frontend (React Router)
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
- Serves React app
- Handles client-side routing (SPA)

### 5. Static Files
```nginx
location ~* \.(js|css|png|jpg|...)$ {
    expires 1y;
}
```
- Caches static assets for 1 year
- Improves performance

---

## How to Apply

### 1. Copy to VPS
```bash
# On your local machine
scp jsang-psong-wedding.com root@your-vps:/tmp/

# On VPS
sudo cp /tmp/jsang-psong-wedding.com /etc/nginx/sites-available/jsang-psong-wedding.com
```

### 2. Test Configuration
```bash
sudo nginx -t
```

### 3. Reload Nginx
```bash
sudo systemctl reload nginx
```

---

## Important Paths

- **Website files**: `/var/www/jsang-psong-wedding.com/`
- **Uploads**: `/root/projects/wedding_rsvp/uploads/`
- **API**: Running on `localhost:3002`
- **Config file**: `/etc/nginx/sites-available/jsang-psong-wedding.com`

---

## Testing

```bash
# Test health check
curl https://jsang-psong-wedding.com/health

# Test API
curl https://jsang-psong-wedding.com/api/admin/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'

# Test website
curl -I https://jsang-psong-wedding.com
```

---

## Troubleshooting

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Nginx Logs
```bash
# Error logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# Access logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.access.log
```

### Test Configuration
```bash
sudo nginx -t
```

### Reload After Changes
```bash
sudo systemctl reload nginx
```

---

## Security Features

✅ SSL/HTTPS enforced
✅ Security headers (X-Frame-Options, etc.)
✅ Hidden files denied
✅ CORS configured
✅ Static file caching
✅ HTTP to HTTPS redirect

---

**Ready to use!** Just copy to your VPS and reload Nginx.

