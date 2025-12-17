# Mobile App - Local API Setup Complete ✅

## What's Been Done

### 1. API Configuration Updated
- **File**: `mobile_app/src/config/api.js`
- **Local IP**: `http://192.168.100.3:3002/api` (your computer's IP)
- **Production**: `https://jsang-psong-wedding.com/api` (ready for VPS)

### 2. All Mock Data Replaced with Real API
✅ **SplashScreen** - Loads wedding info from API  
✅ **HomeScreen** - Loads wedding info from API  
✅ **GroomProfileScreen** - Loads from `realApi.getGroomProfile()`  
✅ **BrideProfileScreen** - Loads from `realApi.getBrideProfile()`  
✅ **PhotoFeedScreen** - Uses `realApi.getPhotos()` and `realApi.likePhoto()`  
✅ **PhotoDetailScreen** - Uses `realApi.likePhoto()`, `realApi.addComment()`, `realApi.likeComment()`  
✅ **PhotoUploadScreen** - Uses `realApi.getTags()` and `realApi.uploadPhoto()`  
✅ **SeatMapScreen** - Uses `realApi.getSeats()`  
✅ **VideosScreen** - Uses `realApi.getVideos()`  
✅ **TimelineScreen** - Uses `realApi.getTimeline()`  
✅ **ThemeProvider** - Uses AsyncStorage instead of mockApi

### 3. API Endpoints Added
Added to `realApi.js`:
- `getWeddingInfo()` - Get wedding details
- `getGroomProfile()` - Get groom profile
- `getBrideProfile()` - Get bride profile

## How to Test Locally

### Step 1: Start Your Local API
```bash
cd api
npm start
# API should run on http://localhost:3002
```

### Step 2: Verify Your IP
Your current IP is set to: `192.168.100.3`

If your IP changes, update `mobile_app/src/config/api.js`:
```javascript
dev: {
  apiUrl: 'http://YOUR_NEW_IP:3002/api',
}
```

### Step 3: Start Mobile App
```bash
cd mobile_app
npx expo start
```

### Step 4: Test on Android
1. Open Expo Go on your Android device
2. Scan QR code
3. App will connect to `http://192.168.100.3:3002/api`
4. Test login with phone number from RSVPs table
5. Test all features (photos, seats, videos, timeline)

## Switch to VPS (When Ready)

When your API is deployed to VPS and everything works:

1. **Update `mobile_app/src/config/api.js`**:
   ```javascript
   dev: {
     apiUrl: 'https://jsang-psong-wedding.com/api', // Change to VPS
   },
   ```

2. **Or build for production**:
   - Production build automatically uses `ENV.prod.apiUrl`
   - Which is already set to `https://jsang-psong-wedding.com/api`

## Important Notes

- **Phone Number Required**: Most API calls need `user_phone` from AsyncStorage
- **Login First**: Users must login before using features like likes/comments
- **Photo Upload**: Uses FormData - make sure backend accepts multipart/form-data
- **Error Handling**: All API calls have try/catch with fallback to empty arrays/defaults

## Testing Checklist

- [ ] Login with phone number works
- [ ] Wedding info displays correctly
- [ ] Photos load from API
- [ ] Like photo works
- [ ] Add comment works
- [ ] Upload photo works
- [ ] Seats load from API
- [ ] Videos load from API
- [ ] Timeline loads from API
- [ ] Profiles load from API

## Troubleshooting

**Network Error?**
- Make sure API is running on `localhost:3002`
- Check your computer's IP hasn't changed
- Ensure phone and computer are on same WiFi network
- Try `http://192.168.100.3:3002/health` in browser

**API Not Found?**
- Check backend routes match what `realApi.js` expects
- Verify `/wedding-info`, `/profiles/groom`, `/profiles/bride` endpoints exist

**Login Fails?**
- Check phone number format (normalized, no symbols)
- Verify RSVPs table has matching phone numbers

