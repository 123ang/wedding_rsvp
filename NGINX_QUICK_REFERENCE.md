# Nginx Quick Reference Card

## Your VPS Details
- **IP Address:** 110.4.47.197
- **Domain:** jsang-psong-wedding.com
- **Website Path:** /var/www/jsang-psong-wedding.com
- **Git Repository:** /root/projects/wedding_rsvp

---

## Essential Commands

### Connect to VPS
```bash
ssh root@110.4.47.197
# or
ssh username@110.4.47.197
```

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# Start/Stop/Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx  # Reload config without downtime

# Test configuration
sudo nginx -t

# View configuration
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

### Supabase Configuration
```bash
# Verify Supabase config in your code
cat /root/projects/wedding_rsvp/src/config/supabase.js

# Note: No PHP/MySQL needed - frontend connects directly to Supabase!
```

### View Logs
```bash
# Nginx error log
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# Nginx access log
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.access.log

# Supabase connection issues? Check browser console or network tab

# All nginx logs
sudo tail -f /var/log/nginx/error.log
```

### File Permissions
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com

# Fix permissions
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# Make API writable (if needed)
sudo chmod -R 775 /var/www/jsang-psong-wedding.com/api
```

### Deploy from Git Repository (Recommended)
```bash
# On VPS - Navigate to git repo
cd /root/projects/wedding_rsvp

# Pull latest changes
git pull

# Build frontend
npm run build

# Deploy to web directory
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/
sudo cp -r api /var/www/jsang-psong-wedding.com/

# Set permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# Or use the deployment script
chmod +x deploy.sh
./deploy.sh
```

### Upload Files (from Windows - Alternative)
```powershell
# In PowerShell on your local machine
cd C:\Users\User\Desktop\Website\wedding_rsvp

# Build first
npm run build

# Upload dist folder
scp -r dist/* root@110.4.47.197:/var/www/jsang-psong-wedding.com/

# Upload api folder
scp -r api root@110.4.47.197:/var/www/jsang-psong-wedding.com/
```

### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com

# Renew certificate (auto-renewal is set up automatically)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Supabase (No Database Setup Needed!)
```bash
# Your database is in Supabase cloud - no MySQL needed!

# To verify Supabase connection:
# 1. Check src/config/supabase.js has correct URL and API key
# 2. Visit Supabase dashboard to verify project is active
# 3. Check browser console for any connection errors
```

---

## Troubleshooting Quick Fixes

### Website not loading?
```bash
# 1. Check nginx is running
sudo systemctl status nginx

# 2. Check nginx config
sudo nginx -t

# 3. Check error logs
sudo tail -20 /var/log/nginx/jsang-psong-wedding.com.error.log

# 4. Reload nginx
sudo systemctl reload nginx
```

### Supabase Connection Issues?
```bash
# 1. Check Supabase config
cat /root/projects/wedding_rsvp/src/config/supabase.js

# 2. Verify Supabase project is active (check Supabase dashboard)

# 3. Check browser console for API errors
# 4. Verify network requests in browser DevTools
```

### 404 Not Found?
```bash
# 1. Check files exist
ls -la /var/www/jsang-psong-wedding.com/

# 2. Check file permissions
ls -la /var/www/jsang-psong-wedding.com/index.html

# 3. Fix permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
```

### Supabase API not working?
```bash
# 1. Check Supabase configuration
cat /root/projects/wedding_rsvp/src/config/supabase.js

# 2. Verify Supabase URL and API key are correct
# 3. Check browser console for errors
# 4. Verify Supabase project is active in Supabase dashboard
# 5. Check network tab in browser DevTools for API requests
```

### DNS not working?
```bash
# Check DNS propagation
nslookup jsang-psong-wedding.com

# Or from VPS
dig jsang-psong-wedding.com

# Should return: 110.4.47.197
```

---

## File Locations

| Item | Path |
|------|------|
| Website files | `/var/www/jsang-psong-wedding.com/` |
| Nginx config | `/etc/nginx/sites-available/jsang-psong-wedding.com` |
| Nginx enabled | `/etc/nginx/sites-enabled/jsang-psong-wedding.com` |
| Nginx logs | `/var/log/nginx/jsang-psong-wedding.com.*.log` |
| Supabase config | `/root/projects/wedding_rsvp/src/config/supabase.js` |
| Git repository | `/root/projects/wedding_rsvp/` |

---

## Common Nginx Config Edits

### Edit Nginx Config
```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

### After editing, always:
```bash
# 1. Test config
sudo nginx -t

# 2. If test passes, reload
sudo systemctl reload nginx
```

### Add CORS headers (if needed):
Add to `/api` location block:
```nginx
add_header Access-Control-Allow-Origin "https://jsang-psong-wedding.com" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
```

---

## Testing Your Site

### From VPS:
```bash
# Test HTTP
curl http://localhost
curl http://jsang-psong-wedding.com

# Test API
curl http://localhost/api/bride-rsvp.php
```

### From Browser:
- `http://110.4.47.197` (before DNS)
- `http://jsang-psong-wedding.com` (after DNS)
- `https://jsang-psong-wedding.com` (after SSL)

---

## Security Checklist

- [ ] Firewall configured: `sudo ufw allow 'Nginx Full'`
- [ ] SSL certificate installed
- [ ] Supabase URL and API key configured correctly
- [ ] File permissions set correctly
- [ ] Hidden files denied access (already in config)
- [ ] Security headers added (already in config)

---

## Backup Commands

```bash
# Backup website files
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/jsang-psong-wedding.com

# Backup Supabase data (export from Supabase dashboard or use Supabase CLI)

# Backup nginx config
cp /etc/nginx/sites-available/jsang-psong-wedding.com ~/nginx-backup.conf
```

---

## Need More Help?

1. Check full guide: `NGINX_DOMAIN_SETUP.md`
2. Check error logs first
3. Test nginx config: `sudo nginx -t`
4. Verify services are running

