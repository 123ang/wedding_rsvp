# Deployment Guide - Changing Your Domain

## Quick Domain Change

When you're ready to deploy to production, you only need to change **ONE file**:

### File: `src/config/constants.js`

Change line 8 from:
```javascript
PROD_API_URL: 'http://localhost/wedding_rsvp/api',
```

To your production domain:
```javascript
PROD_API_URL: 'https://jsang-psong-wedding.com/api',
```

### Also update the Admin Dashboard files

For the admin pages, update these 2 files:

1. **`src/pages/AdminLoginPage.jsx`** - Line ~23
2. **`src/pages/AdminDashboard.jsx`** - Line ~18

Change from:
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://jsang-psong-wedding.com/api'   // Change this line
  : 'http://localhost/wedding_rsvp/api';
```

To your domain:
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://jsang-psong-wedding.com/api'   // Your actual domain
  : 'http://localhost/wedding_rsvp/api';
```

## Complete Deployment Checklist

### 1. Update Domain Settings (3 files)

- [ ] `src/config/constants.js` - Change `PROD_API_URL`
- [ ] `src/pages/AdminLoginPage.jsx` - Change `API_URL` on line 23
- [ ] `src/pages/AdminDashboard.jsx` - Change `API_URL` on line 18

### 2. Update CORS Settings

Edit `api/.htaccess` and `api/admin/.htaccess`:

Change from:
```apache
Header always set Access-Control-Allow-Origin "*"
```

To:
```apache
Header always set Access-Control-Allow-Origin "https://jsang-psong-wedding.com"
```

Or allow multiple origins:
```apache
Header always set Access-Control-Allow-Origin "https://jsang-psong-wedding.com https://www.jsang-psong-wedding.com"
```

### 3. Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

### 4. Upload Files

Upload to your web server:
- Frontend: Upload contents of `dist/` folder to your web root
- API: Upload `api/` folder to your server
- Backend: Upload `database/schema.sql` (if needed)

### 5. Database Configuration

Update `api/config/database.php` with production database credentials:
```php
private $host = "your_production_host";
private $db_name = "wedding_rsvp";
private $username = "your_production_user";
private $password = "your_production_password";
```

### 6. Test Production

Visit your domain and test:
- [ ] Homepage loads
- [ ] Admin login works
- [ ] RSVP submission works
- [ ] Dashboard shows data

## Domain-Specific Settings

### If you want to add more domains:

Edit `src/config/constants.js`:
```javascript
const API_CONFIG = {
  DEV_API_URL: 'http://localhost/wedding_rsvp/api',
  
  // Multiple environments
  PROD_API_URL: process.env.REACT_APP_API_URL || 'https://jsang-psong-wedding.com/api',
  
  // Or for specific environments
  STAGING_API_URL: 'https://staging.jsang-psong-wedding.com/api',
  PROD_API_URL: 'https://jsang-psong-wedding.com/api',
};
```

## Environment Variables (Optional)

For more flexibility, create `.env` file:

```
VITE_API_URL=https://jsang-psong-wedding.com/api
```

Then update `src/config/constants.js`:
```javascript
const API_CONFIG = {
  DEV_API_URL: import.meta.env.VITE_API_URL || 'http://localhost/wedding_rsvp/api',
  PROD_API_URL: import.meta.env.VITE_API_URL || 'https://jsang-psong-wedding.com/api',
};
```

## Testing Production Build Locally

Test your production build before deploying:

```bash
# Build
npm run build

# Preview production build
npm run preview
```

Visit http://localhost:4173 to see your production build.

## Troubleshooting

### "Mixed Content" errors
- Make sure API uses HTTPS in production
- Update `PROD_API_URL` to use `https://`

### CORS errors in production
- Check `.htaccess` CORS settings
- Verify Apache has `mod_headers` enabled

### API not working
- Check API URL is correct in browser DevTools > Network tab
- Verify SSL certificate is valid
- Check server logs for errors

## Quick Reference

**Files to change for domain:**
1. `src/config/constants.js`
2. `src/pages/AdminLoginPage.jsx`
3. `src/pages/AdminDashboard.jsx`
4. `api/.htaccess`
5. `api/admin/.htaccess`
6. `api/config/database.php`

**Testing:**
```bash
npm run build
npm run preview
```

**Deploy:**
Upload `dist/` folder contents to your web server.
