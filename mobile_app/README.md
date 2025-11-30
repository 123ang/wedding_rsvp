# Wedding RSVP Mobile App Prototype

A fully functional React Native mobile app prototype with fake data for wedding RSVP management.

## Features

### Core Features
- ✅ **Splash Screen** - Beautiful app launch screen
- ✅ **Home Dashboard** - Wedding countdown and feature cards
- ✅ **Groom & Bride Profiles** - Detailed information about the couple
- ✅ **Photo Feed (Instagram Style)** - Vertical scrolling photo feed with likes, comments, and tags
- ✅ **Photo Detail** - Full photo view with interactions
- ✅ **Photo Upload** - Upload photos with tags and captions
- ✅ **Seat Map** - Visual seat arrangement with table layout
- ✅ **Videos** - Video list with play buttons
- ✅ **Timeline** - Wedding day schedule
- ✅ **Settings** - App configuration
- ✅ **Theme System** - 6 beautiful color themes

### Instagram-Style Features
- Like/unlike photos
- Comment on photos
- Save/bookmark photos
- Tag system for photo categorization
- View all comments
- Like comments
- Real-time optimistic updates

### Theme Options
1. **浪漫粉金 (Romantic)** - Classic romantic style
2. **优雅紫金 (Elegant)** - Noble elegant style
3. **清新蓝绿 (Fresh)** - Fresh natural style
4. **温暖橙红 (Warm)** - Warm passionate style
5. **经典黑白 (Classic)** - Simple classic style
6. **梦幻粉紫 (Dreamy)** - Dreamy sweet style

## Installation

```bash
cd mobile_app
npm install
```

## Running the App

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Web Browser
```bash
npm run web
```

### Expo Go (Physical Device)
```bash
npx expo start
```

Then scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

## Project Structure

```
mobile_app/
├── src/
│   ├── data/
│   │   └── mockData.js          # All fake data
│   ├── services/
│   │   └── mockApi.js           # Mock API with AsyncStorage
│   ├── utils/
│   │   └── themes.js            # Theme definitions
│   ├── components/
│   │   └── common/
│   │       └── Button.js        # Reusable button component
│   └── (screens are in App.js)
├── App.js                        # Main app with all screens
├── package.json
└── README.md
```

## Mock Data

All data is stored in `src/data/mockData.js` and persisted using AsyncStorage:

- **Wedding Info**: Couple names, date, venue, location
- **Photos**: 3 sample photos with likes, comments, tags
- **Tags**: 8 predefined tags for photo categorization
- **Seats**: 16 seats across 3 tables
- **Videos**: 3 sample videos
- **Timeline**: 5 wedding day events
- **Notifications**: 3 sample notifications

## Mock API

The `mockApi.js` service simulates a real backend with:

- Simulated network delays (200-1000ms)
- Data persistence using AsyncStorage
- Optimistic updates for better UX
- Full CRUD operations for photos, comments, tags, and seats

### Available API Methods

**Photos:**
- `getPhotos()` - Get all photos
- `likePhoto(photoId)` - Toggle like on photo
- `savePhoto(photoId)` - Toggle save/bookmark
- `addComment(photoId, text)` - Add comment to photo
- `likeComment(photoId, commentId)` - Toggle like on comment
- `uploadPhoto(imageUri, caption, tags)` - Upload new photo
- `getSavedPhotos()` - Get bookmarked photos

**Tags:**
- `getTags()` - Get all tags
- `createTag(tagName)` - Create new tag (Host only)
- `deleteTag(tagId)` - Delete tag (Host only)

**Seats:**
- `getSeats()` - Get all seats
- `getMySeat(phone)` - Get user's seat
- `getGuests()` - Get all guests
- `assignSeat(guestId, table, seat)` - Assign seat (Host only)

**Theme:**
- `getTheme()` - Get current theme
- `setTheme(themeId)` - Change theme

**Static Data:**
- `getWeddingInfo()` - Get wedding information
- `getGroomProfile()` - Get groom profile
- `getBrideProfile()` - Get bride profile
- `getVideos()` - Get video list
- `getTimeline()` - Get timeline events
- `getNotifications()` - Get notifications

## Features Demonstration

### Photo Feed
- Scroll through photos
- Tap heart to like/unlike
- Tap bookmark to save
- Tap photo or comment icon to view details
- Tags displayed as badges on photos

### Photo Detail
- View full photo with all interactions
- See all comments
- Add new comments
- Like/unlike comments
- Like/unlike photo
- Save/unsave photo

### Photo Upload
- Pick images from library
- Select multiple tags
- Add caption
- Upload with simulated delay

### Seat Map
- View all tables and seats
- Color-coded seats:
  - White: Empty
  - Pink: Occupied
  - Gold: Your seat
- Legend at bottom

### Theme Selection
- 6 theme options with preview
- Instant theme switching
- Persisted across app restarts

## Next Steps (After Prototype Approval)

1. **Phase 1**: Database migration from Supabase to MySQL
2. **Phase 2**: Build Express/Node.js backend API
3. **Phase 3**: Connect mobile app to real backend
4. **Phase 4**: Add remaining features (RSVP, Map, Tag Management)
5. **Phase 5**: Testing and deployment

## Technologies Used

- **React Native** with Expo
- **React Navigation** (Stack + Bottom Tabs)
- **AsyncStorage** for local data persistence
- **Expo Image Picker** for photo selection
- **Ionicons** for icons
- **Context API** for theme management

## Notes

- This is a **prototype with fake data** for demonstration purposes
- No real backend connection required
- All data persists locally using AsyncStorage
- Perfect for showing to stakeholders before full development

## Support

For issues or questions, please refer to the main project documentation.


