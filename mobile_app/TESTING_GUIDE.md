# Mobile App Testing Guide

## Prerequisites

Before testing, ensure:

1. ✅ Node.js API is running (either locally or on VPS)
2. ✅ MySQL database is set up with data
3. ✅ Mobile app dependencies are installed
4. ✅ You have Expo Go app installed on your phone

## Step 1: Configure API URL

### Option A: Test with Local API (Development)

1. Find your computer's IP address:
   - Windows: `ipconfig` → Look for IPv4 Address (e.g., 192.168.1.100)
   - Mac: System Preferences → Network
   - Linux: `ip addr`

2. Edit `mobile_app/src/config/api.js`:
   ```javascript
   dev: {
     apiUrl: 'http://YOUR_IP:3002/api', // e.g., 'http://192.168.1.100:3002/api'
   },
   ```

3. Start API locally:
   ```bash
   cd api
   npm start
   ```

### Option B: Test with Production API (VPS)

1. Edit `mobile_app/src/config/api.js`:
   ```javascript
   dev: {
     apiUrl: 'https://jsang-psong-wedding.com/api',
   },
   ```

2. Ensure API is deployed and running on VPS (see PHASE_1_DEPLOYMENT_GUIDE.md)

## Step 2: Start Mobile App

```bash
cd mobile_app
npx expo start
```

## Step 3: Open App on Phone

1. **Ensure phone and computer are on same WiFi** (if testing locally)
2. Open **Expo Go** app on your phone
3. Scan the QR code from terminal

## Step 4: Test API Connection

1. Navigate to **Settings** (bottom tab)
2. Tap **API 测试** (API Test)
3. Run tests in order:

### Test 1: Health Check
- Tap "Health Check"
- ✅ Expected: `{"status": "OK"}`
- ❌ If fails: API server is not running or URL is wrong

### Test 2: Admin Login
- Enter credentials:
  - Email: `angjinsheng@gmail.com`
  - Password: `920214`
- Tap "Admin Login"
- ✅ Expected: `{"success": true, "email": "...", "id": 1}`
- ❌ If fails: Check credentials or database

### Test 3: Get RSVPs
- Tap "Get RSVPs"
- ✅ Expected: List of RSVPs from database
- ❌ If fails: Check if logged in first

### Test 4: Check Auth
- Tap "Check Auth"
- ✅ Expected: `{"success": true, "email": "...", "id": "1"}`
- ❌ If fails: Login first

### Test 5: Test RSVP Submit
- Tap "Test RSVP Submit"
- ✅ Expected: `{"message": "RSVP submitted successfully.", "success": true}`
- ❌ If fails: Check API logs

## Step 5: Test RSVP Submission

1. Go back to **Home** screen
2. Tap **👰 新娘婚礼 RSVP** or **👔 新郎婚礼 RSVP**
3. Fill in the form:
   - Name: Your name
   - Email: test@example.com
   - Phone: 0123456789
   - Attending: Yes
   - Number of guests: 2
   - Relationship: Friend
   - Remark: Testing from mobile app
4. Tap **提交 RSVP**
5. ✅ Expected: Success message and return to home
6. ❌ If fails: Check API logs and form validation

## Step 6: Verify RSVP in Database

### Option A: Check via Website Admin Dashboard
1. Go to https://jsang-psong-wedding.com/admin/login
2. Login with admin credentials
3. Check if new RSVP appears in the list

### Option B: Check via MySQL
```bash
mysql -u root wedding_rsvp
SELECT * FROM rsvps ORDER BY created_at DESC LIMIT 5;
```

## Step 7: Test Other Features

### Photo Feed
- Tap **照片画廊** (Photos) from home
- ✅ Should show mock photos (real photos in Phase 2)
- Test liking and commenting

### Seat Map
- Tap **座位地图** (Seats) from home
- ✅ Should show mock seat map (real seats in Phase 2)

### Videos
- Tap **视频** (Videos) from home
- ✅ Should show mock videos

### Timeline
- Tap **婚礼流程** (Timeline) from home
- ✅ Should show wedding schedule

### Theme Switching
- Go to **Settings** → **主题颜色** (Theme)
- Tap different themes
- ✅ App should change colors immediately

## Troubleshooting

### "Network Error" or "Cannot connect to server"

**Possible causes:**
1. API server not running
2. Wrong IP address in config
3. Phone and computer on different WiFi
4. Firewall blocking port

**Solutions:**
1. Check API is running: `curl http://localhost:3002/health`
2. Test from phone's browser: `http://YOUR_IP:3002/health`
3. Check firewall settings
4. Try using VPS URL instead

### "401 Unauthorized"

**Solution:**
- Login first using API Test screen
- Check admin credentials are correct

### "Timeout"

**Solutions:**
1. Increase timeout in `src/services/realApi.js`
2. Check network connection
3. Check API server logs: `pm2 logs wedding-api`

### "CORS Error"

**Solution:**
- API should already have CORS enabled
- Check `api/server.js` has `app.use(cors())`

### App crashes on RSVP submit

**Solutions:**
1. Check API logs for errors
2. Verify all required fields are filled
3. Check database connection
4. Test API endpoint with curl first:
   ```bash
   curl -X POST http://localhost:3002/api/bride-rsvp \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","phone":"0123456789","attending":true,"number_of_guests":2}'
   ```

## Testing Checklist

### Basic Functionality
- [ ] App opens without crashing
- [ ] Splash screen shows
- [ ] Home screen loads
- [ ] Navigation works (tabs and screens)
- [ ] Theme switching works

### API Integration
- [ ] Health check passes
- [ ] Admin login works
- [ ] Get RSVPs works
- [ ] Auth persists across app restarts

### RSVP Submission
- [ ] Bride RSVP form opens
- [ ] Groom RSVP form opens
- [ ] Form validation works
- [ ] Submit succeeds
- [ ] Data appears in database
- [ ] Success message shows
- [ ] Returns to home after submit

### Mock Features (Phase 0)
- [ ] Photo feed shows mock photos
- [ ] Can like photos
- [ ] Can add comments
- [ ] Photo upload UI works (doesn't save yet)
- [ ] Seat map shows
- [ ] Videos show
- [ ] Timeline shows

### UI/UX
- [ ] Loading states show
- [ ] Error messages show
- [ ] Buttons are responsive
- [ ] Forms are easy to use
- [ ] Colors match theme
- [ ] Text is readable

### Performance
- [ ] App is responsive
- [ ] No lag when scrolling
- [ ] Images load quickly
- [ ] Transitions are smooth

## Next Steps After Testing

Once all tests pass:

1. ✅ **Phase 1 Complete** - API integration working
2. 🔄 **Phase 2** - Implement photo upload backend
3. 🔄 **Phase 3** - Add push notifications
4. 🔄 **Phase 4** - Build for production
5. 🔄 **Phase 5** - Submit to app stores

## Support

If you encounter issues:

1. Check API logs: `pm2 logs wedding-api`
2. Check mobile app console in Expo
3. Test API endpoints with curl/Postman first
4. Check database has data
5. Verify network connectivity

## Production Testing

Before going live:

1. Test with production API URL
2. Test on both iOS and Android
3. Test on different phone sizes
4. Test with slow network
5. Test offline behavior
6. Test with real user data
7. Get feedback from partner

---

**Status**: Ready for testing
**Last Updated**: December 2024

