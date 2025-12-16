# API Timeout Error - Troubleshooting Guide

## Problem
Website shows: `timeout of 10000ms exceeded` when trying to access `/admin/rsvps` and `/admin/relationships`

## What This Means
The API is not responding within 10 seconds. This usually means:
1. ❌ API is not running
2. ❌ API is running but not accessible
3. ❌ Nginx proxy is not working
4. ❌ Database connection is failing

---

## Step 1: Check if API is Running

**On your VPS, run:**
```bash
# Check if PM2 is running the API
pm2 list

# Check API logs
pm2 logs wedding-api

# Check if port 3002 is listening
netstat -tlnp | grep 3002
# Or
ss -tlnp | grep 3002
```

**Expected output:**
- `pm2 list` should show `wedding-api` with status `online`
- `netstat` should show port 3002 is listening

**If not running:**
```bash
cd /root/projects/wedding_rsvp/api
pm2 start server.js --name wedding-api
pm2 logs wedding-api
```

---

## Step 2: Test API Directly

**On VPS:**
```bash
# Test health check
curl http://localhost:3002/health

# Should return: {"status":"OK","message":"Wedding RSVP API is running"}
```

**If this fails:**
- API is not running or crashed
- Check logs: `pm2 logs wedding-api`
- Check for errors in the logs

---

## Step 3: Test Through Nginx

**On VPS:**
```bash
# Test through Nginx
curl https://jsang-psong-wedding.com/health

# Test API endpoint
curl https://jsang-psong-wedding.com/api/admin/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"angjinsheng@gmail.com","password":"920214"}'
```

**If this fails:**
- Nginx proxy is not working
- Check Nginx config: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log`

---

## Step 4: Check Database Connection

**On VPS:**
```bash
# Test database connection
mysql -u wedding_user -p wedding_rsvp

# If this fails, check:
# 1. Database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'wedding_rsvp';"

# 2. User exists
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='wedding_user';"

# 3. Check .env file
cat /root/projects/wedding_rsvp/api/.env
```

**Common issues:**
- Wrong password in `.env`
- Database doesn't exist
- User doesn't have permissions

---

## Step 5: Check API Logs for Errors

**On VPS:**
```bash
# View real-time logs
pm2 logs wedding-api --lines 50

# Look for:
# - Database connection errors
# - Port already in use
# - Missing dependencies
# - Syntax errors
```

**Common errors:**
- `ECONNREFUSED` - Database not accessible
- `EADDRINUSE` - Port 3002 already in use
- `MODULE_NOT_FOUND` - Missing npm packages

---

## Step 6: Restart Everything

**On VPS:**
```bash
# Restart API
pm2 restart wedding-api

# Restart Nginx
sudo systemctl restart nginx

# Check status
pm2 status
sudo systemctl status nginx
```

---

## Quick Fix Commands

### If API is not running:
```bash
cd /root/projects/wedding_rsvp/api
npm install
pm2 start server.js --name wedding-api
pm2 save
```

### If Database connection fails:
```bash
# Check .env file
nano /root/projects/wedding_rsvp/api/.env

# Test connection
mysql -u wedding_user -p wedding_rsvp
```

### If Nginx proxy fails:
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log

# Reload
sudo systemctl reload nginx
```

---

## Increase Timeout (Temporary Fix)

While troubleshooting, you can increase the timeout in the website:

**Edit `website/src/services/api.js`:**
```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increase to 30 seconds
  // ...
});
```

Then rebuild:
```bash
cd website
npm run build
# Re-upload dist files
```

---

## Complete Checklist

- [ ] API is running: `pm2 list` shows `wedding-api`
- [ ] API responds: `curl http://localhost:3002/health` works
- [ ] Database connected: No errors in `pm2 logs wedding-api`
- [ ] Nginx proxy works: `curl https://jsang-psong-wedding.com/health` works
- [ ] API endpoint works: Can login via curl
- [ ] Website API URL is correct: Check `website/.env` or build config

---

## Most Likely Issues

### 1. API Not Started
**Solution:**
```bash
cd /root/projects/wedding_rsvp/api
pm2 start server.js --name wedding-api
```

### 2. Database Connection Error
**Solution:**
- Check `.env` file has correct credentials
- Test: `mysql -u wedding_user -p wedding_rsvp`

### 3. Port Already in Use
**Solution:**
```bash
# Find what's using port 3002
lsof -i :3002
# Kill it or change port in .env
```

### 4. Missing Dependencies
**Solution:**
```bash
cd /root/projects/wedding_rsvp/api
npm install
```

---

## Test After Fixes

1. **Test API directly:**
   ```bash
   curl http://localhost:3002/health
   ```

2. **Test through Nginx:**
   ```bash
   curl https://jsang-psong-wedding.com/health
   ```

3. **Test from browser:**
   - Open: `https://jsang-psong-wedding.com/admin/login`
   - Login and check if dashboard loads

---

**Next Step**: Run the checks above on your VPS to identify the issue!

