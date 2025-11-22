# How to Rebuild and Redeploy Your Website

Since your git repository is at `/root/projects/wedding_rsvp`, here's how to rebuild and redeploy:

## Quick Rebuild (Using Deployment Script)

**On your VPS:**

```bash
# Navigate to your project
cd /root/projects/wedding_rsvp

# Pull latest changes (if using git)
git pull

# Rebuild using the deployment script
./deploy.sh
```

That's it! The script will:
- Build your frontend (`npm run build`)
- Copy files to web directory
- Set permissions
- Reload nginx

---

## Manual Rebuild (Step by Step)

If you prefer to do it manually:

```bash
# 1. Navigate to project
cd /root/projects/wedding_rsvp

# 2. Pull latest changes (if using git)
git pull

# 3. Build frontend
npm run build

# 4. Copy built files to web directory
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/

# 5. Set permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# 6. Reload nginx
sudo systemctl reload nginx
```

---

## After Making Code Changes Locally

If you made changes on your local Windows machine:

### Option A: Push to Git and Pull on VPS

**On your local machine:**
```powershell
cd C:\Users\User\Desktop\Website\wedding_rsvp

# Commit changes
git add .
git commit -m "Your changes"

# Push to repository
git push
```

**Then on VPS:**
```bash
cd /root/projects/wedding_rsvp
git pull
./deploy.sh
```

### Option B: Upload Files Directly to VPS

**On your local machine (PowerShell):**
```powershell
cd C:\Users\User\Desktop\Website\wedding_rsvp

# Build first
npm run build

# Upload to VPS
scp -r dist/* root@110.4.47.197:/var/www/jsang-psong-wedding.com/
```

**Then on VPS:**
```bash
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
sudo systemctl reload nginx
```

---

## Complete Rebuild Workflow

### Scenario 1: You Changed Code on VPS

```bash
cd /root/projects/wedding_rsvp

# Edit your files
nano src/App.jsx
# or use any editor

# Rebuild
npm run build

# Deploy
./deploy.sh
```

### Scenario 2: You Changed Code Locally (Windows)

**Step 1: On Local Machine**
```powershell
cd C:\Users\User\Desktop\Website\wedding_rsvp

# Make your changes
# Build
npm run build

# Option A: Push to git
git add .
git commit -m "Updated website"
git push
```

**Step 2: On VPS**
```bash
cd /root/projects/wedding_rsvp
git pull
./deploy.sh
```

**OR** (if not using git)

```powershell
# On local machine - upload directly
scp -r dist/* root@110.4.47.197:/var/www/jsang-psong-wedding.com/
```

Then on VPS:
```bash
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo systemctl reload nginx
```

---

## Make Deployment Script Executable (First Time Only)

If you get "Permission denied" when running `./deploy.sh`:

```bash
chmod +x /root/projects/wedding_rsvp/deploy.sh
```

---

## Verify Rebuild Worked

```bash
# Check website is updated
curl http://localhost

# Or visit in browser
# https://jsang-psong-wedding.com
```

**Check browser console:**
- Open DevTools (F12)
- Check for errors
- Verify new changes appear

---

## Troubleshooting Rebuild

### npm run build fails?
```bash
# Install dependencies
cd /root/projects/wedding_rsvp
npm install
```

### Files not updating?
```bash
# Clear browser cache
# Or check file permissions
ls -la /var/www/jsang-psong-wedding.com/

# Re-set permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

### Nginx not serving new files?
```bash
# Reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx

# Check error logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log
```

---

## Quick Reference

**Fastest way to rebuild:**
```bash
cd /root/projects/wedding_rsvp
./deploy.sh
```

**If no deploy script:**
```bash
cd /root/projects/wedding_rsvp
npm run build
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo systemctl reload nginx
```

---

## Summary

**Every time you make changes:**

1. **Build:** `npm run build` (creates `dist/` folder)
2. **Copy:** Copy `dist/*` to `/var/www/jsang-psong-wedding.com/`
3. **Permissions:** Fix ownership and permissions
4. **Reload:** `sudo systemctl reload nginx`

**Or use the script:**
```bash
cd /root/projects/wedding_rsvp
./deploy.sh
```

Done! 🎉

