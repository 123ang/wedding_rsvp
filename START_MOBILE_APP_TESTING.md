# 🚀 Quick Start: Mobile App Testing

## Prerequisites Checklist

- [ ] Node.js installed
- [ ] Expo Go app installed on your phone
- [ ] Phone and computer on same WiFi (for local testing)
- [ ] API server ready (local or VPS)

## Option 1: Test with Local API (Recommended for First Test)

### Step 1: Configure API URL

1. Find your computer's IP:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig | grep "inet "
   ```

2. Edit `mobile_app/src/config/api.js`:
   ```javascript
   dev: {
     apiUrl: 'http://YOUR_IP:3002/api', // Replace YOUR_IP
   },
   ```

### Step 2: Start API Server

```bash
cd api
npm start
```

Should see: `Server running on port 3002`

### Step 3: Start Mobile App

```bash
cd mobile_app
npx expo start
```

### Step 4: Open on Phone

1. Open **Expo Go** app
2. Scan QR code from terminal
3. Wait for app to load

### Step 5: Test API Connection

1. Tap **Settings** (bottom right)
2. Tap **API 测试** (first option)
3. Run tests:
   - Health Check ✅
   - Admin Login ✅
   - Get RSVPs ✅
   - Check Auth ✅
   - Test RSVP Submit ✅

### Step 6: Test RSVP Submission

1. Go back to **Home**
2. Tap **👰 新娘婚礼 RSVP**
3. Fill form and submit
4. Check database for new entry

---

## Option 2: Test with Production API (VPS)

### Step 1: Deploy API First

Follow `PHASE_1_DEPLOYMENT_GUIDE.md` to deploy API to VPS.

### Step 2: Configure Production URL

Edit `mobile_app/src/config/api.js`:
```javascript
dev: {
  apiUrl: 'https://jsang-psong-wedding.com/api',
},
```

### Step 3: Start Mobile App

```bash
cd mobile_app
npx expo start
```

### Step 4: Test

Same as Option 1, Steps 4-6.

---

## Troubleshooting

### "Network Error"
- ✅ Check API is running: `curl http://localhost:3002/health`
- ✅ Check IP address is correct
- ✅ Check phone and computer on same WiFi
- ✅ Check firewall not blocking port 3002

### "Cannot connect"
- ✅ Try production URL instead
- ✅ Test from phone browser: `http://YOUR_IP:3002/health`
- ✅ Restart API server

### "401 Unauthorized"
- ✅ Login first in API Test screen
- ✅ Check credentials: `angjinsheng@gmail.com` / `920214`

---

## Success Criteria

✅ Health check passes
✅ Admin login works
✅ Can view RSVPs
✅ Can submit new RSVP
✅ New RSVP appears in database
✅ All screens navigate correctly
✅ Theme switching works

---

## What to Test

### Must Test:
1. ✅ API connection
2. ✅ RSVP submission (bride)
3. ✅ RSVP submission (groom)
4. ✅ Form validation
5. ✅ Error handling

### Nice to Test:
1. Photo feed (mock data)
2. Seat map (mock data)
3. Videos (mock data)
4. Timeline (mock data)
5. Theme switching

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. 🔄 Deploy API to VPS
3. 🔄 Update mobile config to production URL
4. 🔄 Test with production API
5. 🔄 Show to partner for feedback
6. 🔄 Plan Phase 2 (photo upload backend)

---

## Quick Commands Reference

```bash
# Start API
cd api && npm start

# Start Mobile App
cd mobile_app && npx expo start

# Check API health
curl http://localhost:3002/health

# View API logs
pm2 logs wedding-api

# Check database
mysql -u root wedding_rsvp
SELECT * FROM rsvps ORDER BY created_at DESC LIMIT 5;
```

---

**Need Help?** See `mobile_app/TESTING_GUIDE.md` for detailed instructions.

