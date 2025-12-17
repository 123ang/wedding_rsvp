# Fix 404 for /uploads - Step by Step

## Quick Debug Steps (Run on Your VPS)

### Step 1: Check if the path exists
```bash
ls -la /root/projects/wedding_rsvp/uploads/photos
```

**If this fails**, the path is wrong. Find the correct path:
```bash
# Find where uploads actually is
find /root -name "uploads" -type d 2>/dev/null
find /home -name "uploads" -type d 2>/dev/null
```

### Step 2: Check permissions
```bash
# Check current permissions
ls -la /root/projects/wedding_rsvp/uploads/

# Check if nginx user (www-data) can read
sudo -u www-data ls /root/projects/wedding_rsvp/uploads/photos
```

**If this fails with "Permission denied"**, fix permissions:
```bash
sudo chown -R www-data:www-data /root/projects/wedding_rsvp/uploads
sudo chmod -R 755 /root/projects/wedding_rsvp/uploads
```

### Step 3: Check nginx error logs
```bash
# Watch nginx error log in real-time
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# Then try accessing an image URL in browser
# You'll see the exact error
```

### Step 4: Test nginx can access the files
```bash
# Test as nginx user
sudo -u www-data cat /root/projects/wedding_rsvp/uploads/photos/photo-*.jpg | head -c 100
```

## Common Issues & Fixes

### Issue 1: Path doesn't exist
**Symptom:** `ls: cannot access '/root/projects/wedding_rsvp/uploads': No such file or directory`

**Fix:** Find the correct path and update nginx config:
```bash
# Find actual path
find /root -type d -name "uploads" 2>/dev/null
# Then update nginx config with correct path
```

### Issue 2: Permission denied
**Symptom:** nginx error log shows "Permission denied" or "13: Permission denied"

**Fix:**
```bash
# Give nginx user access
sudo chown -R www-data:www-data /root/projects/wedding_rsvp/uploads
sudo chmod -R 755 /root/projects/wedding_rsvp/uploads

# Also check parent directories
sudo chmod 755 /root
sudo chmod 755 /root/projects
sudo chmod 755 /root/projects/wedding_rsvp
```

**⚠️ WARNING:** Making `/root` readable is a security risk. Better solution: move uploads out of `/root`.

### Issue 3: Nginx config syntax
**Symptom:** nginx won't reload

**Fix:** I've updated your config to remove trailing slashes. Test:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Issue 4: Files don't exist in database
**Symptom:** Path exists, permissions OK, but still 404

**Fix:** Check what files actually exist:
```bash
# List actual files
ls -la /root/projects/wedding_rsvp/uploads/photos/

# Check database for image_url values
# The filename in database must match actual filename
```

## Alternative: Move Uploads to /var/www (RECOMMENDED)

This is more secure than giving www-data access to /root:

```bash
# 1. Create new location
sudo mkdir -p /var/www/wedding_rsvp_uploads
sudo mkdir -p /var/www/wedding_rsvp_uploads/photos
sudo mkdir -p /var/www/wedding_rsvp_uploads/videos

# 2. Copy existing files (if any)
sudo cp -r /root/projects/wedding_rsvp/uploads/* /var/www/wedding_rsvp_uploads/

# 3. Set permissions
sudo chown -R www-data:www-data /var/www/wedding_rsvp_uploads
sudo chmod -R 755 /var/www/wedding_rsvp_uploads

# 4. Update nginx config
# Change: alias /root/projects/wedding_rsvp/uploads;
# To: alias /var/www/wedding_rsvp_uploads;

# 5. Update Node.js to save to new location
# Edit api/routes/photos.js - change upload directory
```

## Test After Fixing

1. **Test in browser:**
   ```
   https://jsang-psong-wedding.com/uploads/photos/photo-123.jpg
   ```

2. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/jsang-psong-wedding.com.access.log
   ```

3. **Check for errors:**
   ```bash
   sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log
   ```

## Still Not Working?

Run the debug script I created:
```bash
chmod +x debug_uploads_404.sh
./debug_uploads_404.sh
```

This will show you exactly what's wrong.

