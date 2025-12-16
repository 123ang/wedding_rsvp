# Fix: Remove "Local Network Access" Prompt

## Problem
Users see a browser prompt asking for "Local network access" when visiting your website. This happens because the website was trying to access `http://localhost/...` which triggers browser security.

## Root Cause
Found **TWO** API configuration files:
1. ✅ `website/src/config/api.js` - Already fixed
2. ❌ `website/src/config/constants.js` - Had hardcoded `http://localhost/wedding_rsvp/api`

## Solution
Updated `website/src/config/constants.js` to:
- Use **relative path `/api`** in production
- Remove all `localhost` references
- Works with your Nginx proxy automatically

## Changes Made

**Before:**
```javascript
PROD_API_URL: 'http://localhost/wedding_rsvp/api',  // ❌ Triggers local network prompt
```

**After:**
```javascript
PROD_API_URL: '/api',  // ✅ Relative path, no local network access needed
getBaseURL: () => {
  return '/api';  // Always use relative path
}
```

## How It Works

**Production:**
- Website uses: `/api` (relative path)
- Browser requests: `https://jsang-psong-wedding.com/api/...`
- Nginx proxies to: `http://localhost:3002/api/...` (server-side, invisible to browser)
- ✅ No local network access prompt!

**Development:**
- Uses: `/api` (Vite proxy handles it)
- No localhost in browser requests

## Next Steps

### 1. Rebuild Website
```bash
cd /root/projects/wedding_rsvp/website
npm run build
```

### 2. Deploy
```bash
cp -r dist/* /var/www/jsang-psong-wedding.com/
```

### 3. Clear Browser Cache
Users should:
- Clear browser cache
- Or use incognito/private mode
- The prompt should no longer appear

### 4. Verify
- Visit: `https://jsang-psong-wedding.com`
- Check browser console (F12) - should see API calls to `/api/...`
- No "Local network access" prompt should appear

## Why This Works

**Relative paths (`/api`) are safe:**
- Browser makes request to same domain
- No cross-origin or local network access needed
- Nginx handles proxying server-side (invisible to browser)

**Absolute localhost URLs (`http://localhost/...`) trigger:**
- Browser security prompt
- Local network access permission
- User confusion

## Summary

✅ **Fixed:** Removed all `localhost` references  
✅ **Result:** No more "Local network access" prompts  
✅ **Users:** Clean experience, no permission dialogs  

