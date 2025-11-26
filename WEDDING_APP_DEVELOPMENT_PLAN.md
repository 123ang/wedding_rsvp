# Wedding RSVP Mobile App Development Plan

## Project Overview

This plan outlines the development of a complete wedding RSVP mobile application system consisting of:

1. **Phase 0: Mobile App Prototype** - Create working prototype with fake data for partner review
2. **Phase 1: Database Migration** - Migrate data from Supabase to MySQL on VPS
3. **Phase 2: Website Migration** - Update existing website to use MySQL instead of Supabase
4. **Phase 3: Backend API** - Express/Node.js REST API for mobile app
5. **Phase 4: Mobile App Integration** - Connect prototype to real backend and complete features

## Project Structure

```
wedding_rsvp/
├── migration_database/          # Database migration scripts
├── backend/                     # Express/Node.js API server
├── mobile_app/                  # React Native mobile application
├── website/                     # Existing web application (to be updated)
├── api/                         # Existing PHP API (to be maintained)
└── database/                    # Database schemas
```

---

## Phase 0: Mobile App Prototype with Fake Data

### 0.1 Overview

Create a fully functional mobile app prototype with hardcoded/fake data to demonstrate all features and UI/UX before building the backend infrastructure. This allows for early feedback and design validation.

### 0.2 Create Mobile App Prototype Folder

**Location:** `mobile_app/`

**Initial Setup:**
- Initialize React Native project (Expo recommended for faster development)
- Set up basic navigation structure
- Create mock data service layer
- Implement all screens with fake data
- No backend connection required

### 0.3 Mock Data Structure

**Create `mobile_app/src/data/mockData.js`:**

```javascript
// Mock data for prototype demonstration
export const mockData = {
  // Wedding info
  weddingInfo: {
    groomName: "Dr. Ang Jin Sheng",
    brideName: "Miss Ong Pei Shi",
    date: "2026-01-04",
    venue: "Starview Restaurant",
    address: "Starview Restaurant, Jalan Dato Keramat, Penang"
  },
  
  // RSVPs
  rsvps: [...],
  
  // Photos with Instagram-style data
  photos: [
    {
      id: 1,
      userId: "user1",
      userName: "张三",
      userPhone: "+60123456789",
      imageUrl: "placeholder",
      caption: "今天真是太美好了！祝福新人 💕",
      tags: ["#婚礼现场", "#美好瞬间"],
      likes: 128,
      comments: 24,
      createdAt: "2026-01-04T10:00:00Z",
      liked: true
    },
    // ... more photos
  ],
  
  // Comments
  comments: [...],
  
  // Tags
  tags: [
    { id: 1, name: "#婚礼现场", usageCount: 45 },
    { id: 2, name: "#美好瞬间", usageCount: 32 },
    // ... more tags
  ],
  
  // Seats
  seats: [
    { tableNumber: 1, seatNumber: 1, guestName: "张三", occupied: true },
    // ... more seats
  ],
  
  // Videos
  videos: [...],
  
  // Timeline events
  timeline: [...]
};
```

### 0.4 Prototype Features to Implement

**All screens from prototype HTML:**

1. **Splash Screen** - App logo and loading
2. **Login Screen** - Optional (can skip to guest mode)
3. **Home Dashboard** - Countdown, hero section, feature cards
4. **Groom Profile** - Groom information page
5. **Bride Profile** - Bride information page
6. **RSVP Screen** - RSVP form (submit to mock service)
7. **Photo Feed** - Instagram-style vertical feed
8. **Photo Detail** - Full photo view with interactions
9. **Photo Upload** - Upload interface (save to local state)
10. **Comments Screen** - Comments list and add comment
11. **Seat Map** - Visual seat arrangement
12. **Seat Management** - Host-only seat assignment
13. **Video List** - Video cards with play buttons
14. **Timeline** - Wedding day schedule
15. **Map Screen** - Venue location and navigation
16. **Settings** - App settings
17. **Theme Selection** - 6 theme options
18. **Tag Management** - Host-only tag CRUD
19. **My Collections** - Saved photos

### 0.5 Mock Services Layer

**Create `mobile_app/src/services/mockApi.js`:**

- Simulate API delays with setTimeout
- Store data in AsyncStorage for persistence
- Implement optimistic updates for likes/comments
- Handle all CRUD operations locally
- No actual network requests

**Key Mock Functions:**
- `getPhotos()` - Return mock photo array
- `likePhoto(photoId)` - Toggle like in local state
- `addComment(photoId, text)` - Add comment to local state
- `uploadPhoto(photo, tags, caption)` - Add to local photos array
- `getRSVPs()` - Return mock RSVP data
- `submitRSVP(data)` - Store in AsyncStorage
- `getSeats()` - Return mock seat map data
- `getVideos()` - Return mock video list
- `getTimeline()` - Return mock timeline events

### 0.6 Technology Stack for Prototype

- **Framework:** React Native (Expo)
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **State Management:** React Context API or Redux (simpler for prototype)
- **Storage:** AsyncStorage (for mock data persistence)
- **Image Picker:** expo-image-picker
- **Maps:** react-native-maps (for map screen)
- **Icons:** react-native-vector-icons or Expo Icons
- **Video:** expo-av (for video playback)
- **Forms:** React Hook Form

### 0.7 Prototype Deliverables

**What to build:**
- Complete UI for all screens matching prototype design
- All navigation flows working
- Interactive elements (buttons, forms, likes, comments)
- Theme switching functionality
- Mock data persistence (survives app restart)
- Smooth animations and transitions
- Responsive design for different screen sizes

**What NOT needed:**
- Real backend API connection
- Real database
- Authentication (can use mock login)
- File upload to server (use local images)
- Real-time updates

### 0.8 Prototype Timeline

**Estimated Time: 1-2 weeks**

- **Day 1-2:** Project setup, navigation structure, theme system
- **Day 3-4:** Home dashboard, profile screens, RSVP form
- **Day 5-6:** Photo feed, photo detail, photo upload
- **Day 7-8:** Comments, likes, interactions
- **Day 9-10:** Seat map, videos, timeline, map screens
- **Day 11-12:** Settings, theme selection, tag management
- **Day 13-14:** Polish, animations, testing, bug fixes

### 0.9 Benefits of Prototype First

1. **Early Feedback** - Get partner approval on design and flow
2. **Design Validation** - Test UI/UX before backend development
3. **Faster Iteration** - Make design changes without backend changes
4. **Clear Requirements** - Prototype serves as specification for backend
5. **Risk Reduction** - Identify issues early before full development

### 0.10 Transition to Real Backend

**When ready to connect to real backend:**
- Replace `mockApi.js` with real `api.js`
- Update service calls to use axios
- Connect to Express backend API
- Migrate mock data to database
- Add real authentication
- Implement real file uploads

---

## Phase 1: Database Migration Setup

### 1.1 Create Migration Database Folder

**Location:** `migration_database/`

**Files to create:**
- `migrate-supabase-to-mysql.js` - Main migration script
- `package.json` - Node.js dependencies
- `.env.example` - Environment variables template
- `.env` - Actual environment variables (gitignored)
- `.gitignore` - Ignore node_modules, .env, logs
- `README.md` - Migration instructions

**Key Features:**
- Connect to Supabase PostgreSQL
- Connect to MySQL on VPS
- Migrate `admin_users` table
- Migrate `rsvps` table
- Handle data type conversions (BIGSERIAL → INT, TIMESTAMP WITH TIME ZONE → TIMESTAMP)
- Preserve original IDs
- Skip duplicates based on unique constraints
- Comprehensive logging (console + log files)
- Error handling and rollback capability

**Dependencies:**
- `pg` - PostgreSQL client
- `mysql2` - MySQL client
- `dotenv` - Environment variables

### 1.2 Website Migration from Supabase to MySQL

**Location:** `website/src/`

**Files to modify:**

1. **`website/src/config/supabase.js`** → Rename to `website/src/config/api.js`
   - Remove Supabase URL and API key constants
   - Add API base URL configuration pointing to existing PHP API
   - Remove `getSupabaseHeaders()` function
   - Add standard API configuration for PHP endpoints

2. **`website/src/services/api.js`**
   - Replace all Supabase REST API calls with standard HTTP requests to PHP API
   - Update `submitBrideRSVP()` to use `/api/bride-rsvp.php`
   - Update `submitGroomRSVP()` to use `/api/groom-rsvp.php`
   - Update `adminLogin()` to use `/api/admin/login.php`
   - Update `getAllRSVPs()` to use `/api/admin/get-rsvps.php`
   - Update `updatePaymentAmount()` to use `/api/admin/update-payment.php`
   - Update `updateSeatTable()` - may need to add endpoint in PHP API
   - Remove Supabase-specific query parameters (eq., select, order)
   - Change axios baseURL to use relative paths or domain
   - Update error handling for standard HTTP responses
   - Remove Supabase client instance, use standard axios instance

**Key Changes:**
- Replace Supabase REST API format with standard REST API format
- Update request/response handling to match PHP API format
- Maintain existing functionality
- Ensure backward compatibility
- Update all imports from `supabase.js` to `api.js`

**Files that import from supabase.js:**
- Check and update all files importing from `config/supabase.js`

**Testing Checklist:**
- Test RSVP submission (bride and groom)
- Test admin login functionality
- Test admin dashboard data fetching
- Test payment amount updates
- Test seat table updates
- Verify error handling works correctly

---

## Phase 2: Backend API Development

### 2.1 Create Backend Folder Structure

**Location:** `backend/`

**Folder Structure:**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection
│   │   └── constants.js         # App constants
│   ├── controllers/
│   │   ├── authController.js    # Admin authentication
│   │   ├── rsvpController.js    # RSVP CRUD
│   │   ├── photoController.js   # Photo management
│   │   ├── commentController.js # Comments CRUD
│   │   ├── likeController.js    # Likes management
│   │   ├── tagController.js     # Tags CRUD (host only)
│   │   ├── seatController.js    # Seat management
│   │   ├── videoController.js   # Video management
│   │   └── timelineController.js # Timeline events
│   ├── models/
│   │   ├── Admin.js             # Admin user model
│   │   ├── RSVP.js              # RSVP model
│   │   ├── Photo.js             # Photo model
│   │   ├── Comment.js           # Comment model
│   │   ├── Like.js              # Like model
│   │   ├── Tag.js               # Tag model
│   │   ├── Seat.js              # Seat model
│   │   └── Video.js             # Video model
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── rsvps.js             # RSVP routes
│   │   ├── photos.js            # Photo routes
│   │   ├── comments.js          # Comment routes
│   │   ├── likes.js             # Like routes
│   │   ├── tags.js              # Tag routes (host only)
│   │   ├── seats.js             # Seat routes
│   │   ├── videos.js            # Video routes
│   │   └── timeline.js          # Timeline routes
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── hostAuth.js          # Host-only routes
│   │   ├── upload.js            # File upload handling
│   │   └── errorHandler.js      # Error handling
│   ├── utils/
│   │   ├── logger.js            # Logging utility
│   │   └── validators.js        # Input validation
│   └── server.js                # Express app entry point
├── uploads/                      # Uploaded files directory
│   ├── photos/
│   └── videos/
├── .env.example
├── .env
├── .gitignore
├── package.json
└── README.md
```

### 2.2 Database Schema Extensions

**New tables needed for mobile app features:**

1. **photos** table:
   - id, user_id, user_name, user_phone, image_url, caption, created_at, updated_at
   
2. **photo_tags** (many-to-many):
   - photo_id, tag_id
   
3. **tags** table:
   - id, name, usage_count, created_at
   
4. **likes** table:
   - id, user_id, user_name, user_phone, photo_id, comment_id (nullable), created_at
   
5. **comments** table:
   - id, photo_id, user_id, user_name, user_phone, text, created_at, updated_at
   
6. **seats** table:
   - id, table_number, seat_number, guest_name, guest_phone, rsvp_id, created_at
   
7. **videos** table:
   - id, title, description, video_url, thumbnail_url, duration, created_at
   
8. **timeline_events** table:
   - id, time, title, description, location, created_at

### 2.3 API Endpoints

**Authentication:**
- POST `/api/auth/login` - Admin login
- POST `/api/auth/verify` - Verify JWT token

**RSVP:**
- GET `/api/rsvps` - Get all RSVPs (admin only)
- POST `/api/rsvps` - Create RSVP
- GET `/api/rsvps/:id` - Get RSVP by ID
- PUT `/api/rsvps/:id` - Update RSVP (admin only)
- DELETE `/api/rsvps/:id` - Delete RSVP (admin only)

**Photos:**
- GET `/api/photos` - Get all photos (paginated)
- POST `/api/photos` - Upload photo (with tags)
- GET `/api/photos/:id` - Get photo details
- DELETE `/api/photos/:id` - Delete photo (owner or admin)

**Comments:**
- GET `/api/photos/:photoId/comments` - Get comments for photo
- POST `/api/photos/:photoId/comments` - Add comment
- DELETE `/api/comments/:id` - Delete comment (owner or admin)

**Likes:**
- POST `/api/photos/:photoId/like` - Like/unlike photo
- POST `/api/comments/:commentId/like` - Like/unlike comment
- GET `/api/photos/:photoId/likes` - Get likes for photo

**Tags:**
- GET `/api/tags` - Get all tags
- POST `/api/tags` - Create tag (host only)
- DELETE `/api/tags/:id` - Delete tag (host only)

**Seats:**
- GET `/api/seats` - Get all seats
- GET `/api/seats/my-seat` - Get user's seat (by phone)
- POST `/api/seats` - Assign seat (host only)
- PUT `/api/seats/:id` - Update seat (host only)

**Videos:**
- GET `/api/videos` - Get all videos
- GET `/api/videos/:id` - Get video details

**Timeline:**
- GET `/api/timeline` - Get all timeline events

### 2.4 Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (using mysql2)
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** multer
- **Validation:** express-validator
- **CORS:** cors middleware
- **Environment:** dotenv

---

## Phase 3: Mobile App Development

### 3.1 Create Mobile App Folder Structure

**Location:** `mobile_app/`

**Folder Structure:**
```
mobile_app/
├── src/
│   ├── screens/
│   │   ├── SplashScreen.js
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── GroomProfileScreen.js
│   │   ├── BrideProfileScreen.js
│   │   ├── RSVPScreen.js
│   │   ├── PhotoFeedScreen.js
│   │   ├── PhotoDetailScreen.js
│   │   ├── PhotoUploadScreen.js
│   │   ├── CommentsScreen.js
│   │   ├── SeatMapScreen.js
│   │   ├── VideoListScreen.js
│   │   ├── TimelineScreen.js
│   │   ├── MapScreen.js
│   │   ├── SettingsScreen.js
│   │   ├── ThemeSelectionScreen.js
│   │   ├── TagManagementScreen.js (host only)
│   │   └── SeatManagementScreen.js (host only)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Card.js
│   │   │   └── LoadingSpinner.js
│   │   ├── photo/
│   │   │   ├── PhotoPost.js
│   │   │   ├── PhotoGrid.js
│   │   │   └── PhotoUploader.js
│   │   ├── rsvp/
│   │   │   └── RSVPForm.js
│   │   └── navigation/
│   │       ├── BottomTabNavigator.js
│   │       └── StackNavigator.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   └── AuthNavigator.js
│   ├── services/
│   │   ├── api.js              # API client
│   │   ├── auth.js              # Authentication service
│   │   └── storage.js           # AsyncStorage wrapper
│   ├── store/
│   │   ├── actions/
│   │   ├── reducers/
│   │   └── store.js             # Redux store
│   ├── utils/
│   │   ├── theme.js             # Theme management
│   │   ├── constants.js         # App constants
│   │   └── helpers.js           # Helper functions
│   ├── assets/
│   │   ├── images/
│   │   └── fonts/
│   └── App.js
├── android/
├── ios/
├── .env.example
├── .env
├── .gitignore
├── app.json
├── babel.config.js
├── metro.config.js
├── package.json
└── README.md
```

### 3.2 Core Features Implementation

**1. Authentication & Onboarding:**
- Splash screen with app logo
- Login screen (optional - can be guest mode)
- Guest mode support

**2. Home Dashboard:**
- Wedding countdown timer
- Hero section with couple names and date
- Feature cards grid (Groom, Bride, Seats, Photos, Videos, Timeline)
- Bottom tab navigation

**3. RSVP Functionality:**
- RSVP form with validation
- Name, email, phone, attending status
- Number of guests
- Organization selection (for groom wedding)
- Submit and confirmation

**4. Photo Feed (Instagram Style):**
- Vertical scrolling feed
- Photo posts with user info
- Like button with count
- Comment button
- Share button
- Tag badges on photos
- Pull to refresh
- Infinite scroll pagination

**5. Photo Detail:**
- Full-screen photo view
- Like/unlike functionality
- Comment section
- View all comments button
- Add comment input
- Tag display

**6. Photo Upload:**
- Image picker (multiple selection)
- Tag selection (multi-select)
- Caption input
- Preview before upload
- Upload progress indicator

**7. Comments System:**
- Comments list with pagination
- Add comment functionality
- Like comments
- User avatars
- Timestamp display

**8. Seat Map:**
- Visual seat map with tables
- Color-coded seats (empty, occupied, my seat)
- Tap to view seat details
- Legend for seat status

**9. Seat Management (Host Only):**
- Guest list
- Assign seats to guests
- Modify seat assignments
- View all tables

**10. Video List:**
- Video cards with thumbnails
- Play button overlay
- Video title and duration
- Tap to play video

**11. Timeline:**
- Vertical timeline layout
- Event cards with time, title, description
- Icons for different event types
- Location information

**12. Map & Location:**
- Map view with venue marker
- Location details card
- Navigation button (opens maps app)
- Parking information

**13. Settings:**
- Theme selection (6 themes)
- Language selection
- Notification settings
- About section
- Logout (if logged in)

**14. Tag Management (Host Only):**
- List of all tags
- Create new tag
- Delete tag
- View usage count

**15. Theme System:**
- 6 predefined themes
- Theme preview cards
- Apply theme functionality
- Persist theme selection

### 3.3 Technology Stack

- **Framework:** React Native (Expo)
- **Navigation:** React Navigation
- **State Management:** Redux Toolkit
- **API Client:** Axios
- **Storage:** AsyncStorage
- **Image Picker:** expo-image-picker
- **Maps:** react-native-maps
- **Icons:** react-native-vector-icons
- **Video:** expo-av
- **Forms:** React Hook Form

---

## Phase 4: Integration & Deployment

### 4.1 API Integration

- Configure API base URL in mobile app
- Set up CORS on backend for mobile app
- Implement authentication flow
- Handle API errors gracefully
- Implement retry logic for failed requests

### 4.2 File Upload Setup

- Configure multer for photo uploads
- Set up file storage on VPS
- Implement image compression
- Generate thumbnails
- Set up CDN or static file serving

### 4.3 Database Setup on VPS

- Run migration script to transfer data
- Create new tables for mobile app features
- Set up database backups
- Configure connection pooling

### 4.4 Backend Deployment

- Set up PM2 or systemd for process management
- Configure Nginx reverse proxy
- Set up SSL certificates
- Configure environment variables
- Set up logging and monitoring

### 4.5 Mobile App Build

- Configure app.json for iOS and Android
- Set up app icons and splash screens
- Configure build settings
- Set up app store accounts
- Generate APK/IPA files

---

## Implementation Order

1. **Phase 0 (Week 1-2):** Mobile app prototype with fake data - Show to partner for approval
2. **Phase 1 (Week 3):** Database migration script + Website migration from Supabase
3. **Phase 2 (Week 4-5):** Backend API development
4. **Phase 3 (Week 6-7):** Connect mobile app to real backend, implement remaining features
5. **Phase 4 (Week 8):** Integration, testing, and bug fixes
6. **Week 9:** Deployment and optimization

---

## Key Considerations

1. **Data Migration:**
   - Test migration on staging first
   - Backup MySQL before migration
   - Handle data type differences
   - Preserve relationships

2. **Website Migration:**
   - Test all website functionality after migration
   - Ensure PHP API endpoints work correctly
   - Update error handling
   - Maintain user experience

3. **API Security:**
   - Implement rate limiting
   - Validate all inputs
   - Sanitize file uploads
   - Use HTTPS only
   - Implement proper authentication

4. **Mobile App Performance:**
   - Optimize image loading
   - Implement lazy loading
   - Use FlatList for long lists
   - Cache API responses
   - Optimize bundle size

5. **User Experience:**
   - Offline mode support
   - Loading states
   - Error messages
   - Success feedback
   - Smooth animations

---

## Next Steps

1. Review and approve this plan
2. Set up React Native development environment (Node.js, Expo CLI)
3. Create mobile_app folder structure
4. Begin Phase 0: Build mobile app prototype with fake data
5. Show prototype to partner for feedback and approval
6. After approval, proceed with Phase 1 (Database migration)

