# Fix: API URL Configuration

## Problem
Website is timing out because it's trying to connect to `http://localhost:3001/api` instead of the production API.

## Solution
Updated `website/src/config/api.js` to:
- Use **relative path `/api`** in production (works with Nginx proxy)
- Use `http://localhost:3002/api` in development
- Allow override via `VITE_API_URL` environment variable

## Next Steps

### 1. Rebuild the Website
```bash
cd /root/projects/wedding_rsvp/website
npm run build
```

### 2. Deploy the New Build
```bash
cp -r dist/* /var/www/jsang-psong-wedding.com/
```

### 3. Test
- Open: `https://jsang-psong-wedding.com/admin/login`
- Login and check if dashboard loads

## How It Works

**Production (deployed):**
- Uses relative path: `/api`
- Browser makes request to: `https://jsang-psong-wedding.com/api/...`
- Nginx proxies to: `http://localhost:3002/api/...`

**Development (local):**
- Uses: `http://localhost:3002/api`
- Direct connection to local API

## Optional: Set Environment Variable

If you want to override the API URL, create `website/.env`:
```env
VITE_API_URL=https://jsang-psong-wedding.com/api
```

But the relative path `/api` should work fine in production!

