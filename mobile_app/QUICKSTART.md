# Quick Start Guide - Wedding RSVP Mobile App Prototype

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies
```bash
cd mobile_app
npm install
```

### Step 2: Start the App
```bash
npx expo start
```

### Step 3: View on Device/Simulator

**Option A: Physical Device (Recommended)**
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in terminal
3. App will load on your device

**Option B: iOS Simulator (Mac only)**
- Press `i` in the terminal

**Option C: Android Emulator**
- Press `a` in the terminal

**Option D: Web Browser**
- Press `w` in the terminal

## 📱 App Navigation

### Bottom Tabs
- **首页 (Home)** - Main dashboard with countdown and features
- **照片 (Photos)** - Instagram-style photo feed
- **座位 (Seats)** - Seat map view
- **设置 (Settings)** - App settings and theme selection

### Key Features to Demo

1. **Home Screen**
   - View wedding countdown
   - Tap feature cards to navigate

2. **Photo Feed**
   - Scroll through photos
   - Tap ❤️ to like
   - Tap 🔖 to save
   - Tap 💬 or photo to view details
   - Tap 📷 (top right) to upload

3. **Photo Detail**
   - View all comments
   - Add comments
   - Like comments
   - Like/save photo

4. **Photo Upload**
   - Tap upload area to select photos
   - Choose tags
   - Add caption
   - Upload

5. **Profiles**
   - From Home, tap "认识新郎" or "认识新娘"

6. **Seat Map**
   - View table layout
   - Find your seat (gold color)

7. **Videos**
   - From Home, tap "视频"
   - View video list

8. **Timeline**
   - From Home, tap "婚礼流程"
   - See wedding day schedule

9. **Theme Selection**
   - Go to Settings tab
   - Tap "主题颜色"
   - Choose from 6 themes
   - Theme applies instantly!

## 🎨 Available Themes

1. **浪漫粉金** (Romantic) - Pink & Gold
2. **优雅紫金** (Elegant) - Purple & Gold
3. **清新蓝绿** (Fresh) - Blue & Green
4. **温暖橙红** (Warm) - Orange & Red
5. **经典黑白** (Classic) - Black & White
6. **梦幻粉紫** (Dreamy) - Pink & Purple

## 💾 Data Persistence

All interactions are saved locally:
- Likes, comments, and saves persist
- Theme selection persists
- Uploaded photos persist
- Data survives app restart

## 🔄 Reset Data

To reset all data to initial state:
1. Close the app
2. Clear app data (varies by device)
3. Reopen the app

Or in code, clear AsyncStorage:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

## 📸 Testing Photo Upload

The app uses Expo Image Picker:
- On physical device: Access real camera/gallery
- On simulator: Use sample images
- Uploaded photos appear at top of feed

## 🐛 Troubleshooting

**App won't start:**
```bash
# Clear cache and restart
npx expo start -c
```

**QR code not scanning:**
- Ensure phone and computer are on same WiFi
- Try tunnel mode: `npx expo start --tunnel`

**Images not loading:**
- This is expected - using emoji placeholders
- Real images will work when connected to backend

**Theme not changing:**
- Force close and reopen app
- Check AsyncStorage is working

## 📝 Demo Script for Partner

1. **Show Splash Screen** (2 seconds)
   - Beautiful loading screen

2. **Home Dashboard**
   - "This is the main screen with countdown"
   - "These cards lead to different features"

3. **Photo Feed**
   - "Instagram-style photo sharing"
   - "Users can like, comment, and save photos"
   - Demonstrate liking a photo
   - Tap photo to show detail view

4. **Photo Detail**
   - "Full view with all interactions"
   - Add a comment
   - Like a comment

5. **Photo Upload**
   - "Users can upload their own photos"
   - "Select tags for categorization"
   - "Add captions"

6. **Seat Map**
   - "Visual seat arrangement"
   - "Color-coded for easy identification"
   - "Gold = your seat"

7. **Theme Selection**
   - Go to Settings → 主题颜色
   - "6 beautiful themes to choose from"
   - Switch between themes
   - "Changes apply instantly across entire app"

8. **Other Features**
   - Show Groom/Bride profiles
   - Show Videos
   - Show Timeline

## ✨ Highlight These Points

✅ **Complete UI/UX** - All screens designed and functional
✅ **Instagram-Style** - Modern photo sharing experience
✅ **Theme System** - 6 customizable color schemes
✅ **Smooth Interactions** - Optimistic updates for instant feedback
✅ **Data Persistence** - Everything saves locally
✅ **Ready for Backend** - Just needs API connection

## 🎯 Next Steps After Approval

1. ✅ Partner approves design and features
2. 🔄 Migrate database from Supabase to MySQL
3. 🔄 Build Express/Node.js backend API
4. 🔄 Connect mobile app to real backend
5. 🔄 Add remaining features (RSVP form, Map, etc.)
6. 🔄 Testing and deployment

## 📞 Questions?

This prototype demonstrates all core features with fake data. Once approved, we'll proceed with backend development and real data integration.

**Estimated Timeline:**
- Phase 0 (Prototype): ✅ Complete
- Phase 1 (Database Migration): 1 week
- Phase 2 (Backend API): 2 weeks
- Phase 3 (Mobile App Integration): 2 weeks
- Phase 4 (Testing & Deployment): 1 week

**Total: ~6 weeks from approval to launch**


