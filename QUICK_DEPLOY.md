# Quick Deploy Guide - Git Repository Setup

Since you've cloned to `/root/projects/wedding_rsvp`, follow these steps:

## Prerequisites Check

First, make sure you have Node.js and npm installed on your VPS:

```bash
# Check Node.js
node -v

# Check npm
npm -v

# If not installed:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## Step-by-Step Deployment

### 1. Install Dependencies (First Time Only)

```bash
cd /root/projects/wedding_rsvp
npm install
```

### 2. Verify Supabase Configuration (Before First Build)

Make sure your Supabase configuration is correct:

**File: `src/config/supabase.js`**
```javascript
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

**Note:** No API URLs to update - the frontend connects directly to Supabase!

### 3. Build and Deploy

**Option A: Use the Deployment Script (Easiest)**

```bash
cd /root/projects/wedding_rsvp

# Make script executable (first time only)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Option B: Manual Deployment**

```bash
cd /root/projects/wedding_rsvp

# Build frontend
npm run build

# Copy to web directory
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/
sudo cp -r api /var/www/jsang-psong-wedding.com/

# Set permissions
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# Reload nginx
sudo systemctl reload nginx
```

## For Future Updates

When you make changes to your code:

```bash
cd /root/projects/wedding_rsvp

# Pull latest changes
git pull

# Run deployment script
./deploy.sh
```

That's it! The script will:
- Pull latest code
- Build the frontend
- Copy files to web directory
- Set permissions
- Reload nginx

## Verify Deployment

1. Visit: `https://jsang-psong-wedding.com`
2. Test RSVP submission
3. Check admin login: `https://jsang-psong-wedding.com/admin/login`

## Troubleshooting

### Build fails?
```bash
# Make sure dependencies are installed
cd /root/projects/wedding_rsvp
npm install
```

### Files not updating?
```bash
# Clear nginx cache (if any)
sudo systemctl reload nginx

# Check file permissions
ls -la /var/www/jsang-psong-wedding.com/
```

### Check logs
```bash
# Nginx errors
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# PHP errors
sudo tail -f /var/log/php8.1-fpm.log
```

## File Structure

```
/root/projects/wedding_rsvp/     # Your git repository (development)
├── src/                         # Source code
│   └── config/
│       └── supabase.js          # Supabase configuration
├── dist/                        # Built files (after npm run build)
└── deploy.sh                    # Deployment script

/var/www/jsang-psong-wedding.com/  # Web directory (production)
├── index.html                   # Served by nginx
├── assets/                      # JS/CSS files
└── photos/                      # Images
```

**Remember:** 
- Develop in `/root/projects/wedding_rsvp`
- Deploy to `/var/www/jsang-psong-wedding.com`
- Never edit files directly in `/var/www/` - always deploy from git repo!
- **No PHP/MySQL needed** - frontend connects directly to Supabase!

