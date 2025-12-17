# Mobile App API Testing Guide

## ✅ Comprehensive Test Suite Added

The `ApiTestScreen` now includes **16 comprehensive tests** covering all mobile app endpoints.

## 📋 Available Tests

### 1. Health Check
- Tests basic API connectivity
- Endpoint: `GET /health`

### 2. Guest Login (Phone)
- Tests guest login with phone number
- Normalizes phone (removes +, -, spaces)
- Checks RSVPs table for matching phone
- Supports super admin phones: `01116473648`, `0174907632`
- Saves `user_phone` to AsyncStorage

### 3. Get All RSVPs
- Tests fetching all RSVPs
- Endpoint: `GET /admin/rsvps`
- Returns count and sample data

### 4. Get Wedding Info
- Tests wedding information endpoint
- Endpoint: `GET /wedding-info`
- Used by SplashScreen and HomeScreen

### 5. Get Groom Profile
- Tests groom profile endpoint
- Endpoint: `GET /profiles/groom`
- Used by GroomProfileScreen

### 6. Get Bride Profile
- Tests bride profile endpoint
- Endpoint: `GET /profiles/bride`
- Used by BrideProfileScreen

### 7. Get Seats
- Tests seat map data
- Endpoint: `GET /seats`
- Returns count and sample seat data
- Used by SeatMapScreen

### 8. Get My Seat
- Tests getting seat for specific phone
- Endpoint: `GET /seats/my-seat/{phone}`
- Uses test phone number input

### 9. Get Photos
- Tests photo feed
- Endpoint: `GET /photos?page=1&limit=10&user_phone={phone}`
- Stores first photo ID for like/comment tests
- Used by PhotoFeedScreen

### 10. Get Tags
- Tests photo tags
- Endpoint: `GET /photos/tags/all`
- Used by PhotoUploadScreen

### 11. Get Videos
- Tests videos endpoint
- Endpoint: `GET /videos`
- Returns count and sample video
- Used by VideosScreen

### 12. Get Timeline
- Tests timeline/events endpoint
- Endpoint: `GET /timeline`
- Returns count and sample event
- Used by TimelineScreen

### 13. Like Photo
- Tests photo like functionality
- Endpoint: `POST /likes/photo/{photoId}`
- Requires: logged in user (user_phone)
- Note: Run "Get Photos" first to get a photo ID

### 14. Add Comment
- Tests adding comment to photo
- Endpoint: `POST /comments`
- Requires: logged in user (user_phone)
- Note: Run "Get Photos" first to get a photo ID

### 15. Upload Photo
- Tests photo upload with FormData
- Endpoint: `POST /photos/upload`
- Requires: logged in user (user_phone)
- Opens image picker
- Creates FormData with image, caption, user_phone

### 16. Submit Bride RSVP
- Tests RSVP submission
- Endpoint: `POST /bride-rsvp`
- Uses test phone number

## 🚀 How to Use

### Step 1: Open Test Screen
1. Open mobile app
2. Navigate to **Settings** tab
3. Tap **API 测试** (API Test)

### Step 2: Enter Test Phone
- Enter a phone number in the input field
- Use `01116473648` or `0174907632` for super admin
- Or use any phone from your RSVPs table

### Step 3: Run Tests

**Option A: Run All Tests**
- Tap **🚀 Run All Tests** button
- Runs all 16 tests sequentially
- Shows summary with pass/fail count

**Option B: Run Individual Tests**
- Tap any individual test button
- See detailed results for that specific test

### Step 4: Check Results
- Results appear in the black result box at bottom
- ✅ Green = Success
- ❌ Red = Failed
- Shows response data (truncated if too long)
- Shows error messages if failed

## 📝 Test Flow Recommendations

### Basic Connectivity Test
1. Health Check
2. Get Wedding Info

### Guest Features Test
1. Guest Login (Phone) - **Do this first!**
2. Get My Seat
3. Get Photos
4. Get Seats
5. Get Videos
6. Get Timeline

### Interactive Features Test
1. Guest Login (Phone) - **Required first**
2. Get Photos - **Gets photo ID for next tests**
3. Like Photo
4. Add Comment
5. Upload Photo

### Admin Features Test
1. Get All RSVPs
2. (Admin login tests can be added if needed)

## ⚠️ Important Notes

1. **Login First**: Many tests require `user_phone` in AsyncStorage
   - Run "Guest Login (Phone)" first
   - Or login through the Login screen

2. **Photo Tests**: Tests 13, 14, 15 need a photo ID
   - Run "Get Photos" first to get a photo ID
   - The test automatically stores the first photo ID

3. **Upload Photo**: Requires image picker permission
   - First time will ask for permission
   - Make sure to grant permission

4. **Phone Normalization**: Login test normalizes phone numbers
   - `+65-9059-3872` → `6590593872`
   - `+81-90-8387-6675` → `819083876675`

5. **Super Admin**: Phones `01116473648` and `0174907632` bypass RSVP check

## 🔍 Troubleshooting

**"Please login first" error?**
- Run "Guest Login (Phone)" test first
- Or login through the Login screen

**"No photo ID" error?**
- Run "Get Photos" test first
- This will populate a photo ID for like/comment tests

**Network error?**
- Check API is running on `http://192.168.100.3:3002`
- Verify phone and computer are on same WiFi
- Check API URL in config: `mobile_app/src/config/api.js`

**Permission denied (upload)?**
- Grant media library permission when prompted
- Check device settings if needed

## 📊 Expected Results

All tests should return:
- ✅ Success with response data
- Response time < 2000ms for most endpoints
- Proper data structure matching API response format

## 🎯 Next Steps After Testing

Once all tests pass:
1. ✅ API is working correctly
2. ✅ Mobile app can connect to backend
3. ✅ All features are functional
4. ✅ Ready to switch to VPS (just change API URL)

## 🔄 Switch to VPS

When ready to test with VPS:
1. Update `mobile_app/src/config/api.js`:
   ```javascript
   dev: {
     apiUrl: 'https://jsang-psong-wedding.com/api',
   },
   ```
2. Re-run all tests
3. Verify everything works with production API

