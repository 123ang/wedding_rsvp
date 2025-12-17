# Mobile App API Migration Summary

## ✅ Completed
1. Updated `api.js` to use local IP: `http://192.168.100.3:3002/api`
2. Added missing endpoints to `realApi.js`:
   - `getWeddingInfo()`
   - `getGroomProfile()`
   - `getBrideProfile()`
3. Replaced theme storage from mockApi to AsyncStorage

## 🔄 To Complete in App.js
Replace all mockApi/mockData calls with realApi:

### SplashScreen & HomeScreen
- `mockData.weddingInfo` → Load from `realApi.getWeddingInfo()` (use state)

### GroomProfileScreen & BrideProfileScreen  
- `mockData.groomProfile` → `realApi.getGroomProfile()`
- `mockData.brideProfile` → `realApi.getBrideProfile()`

### PhotoFeedScreen
- `mockApi.getPhotos()` → `realApi.getPhotos(page, limit, userPhone)`
- `mockApi.likePhoto()` → `realApi.likePhoto(photoId, userPhone)`
- `mockApi.savePhoto()` → `realApi.savePhoto()` (if exists) or remove

### PhotoUploadScreen
- `mockApi.getTags()` → `realApi.getTags()`
- `mockApi.uploadPhoto()` → `realApi.uploadPhoto(formData)`

### SeatMapScreen
- `mockApi.getSeats()` → `realApi.getSeats()`

### VideosScreen
- `mockData.videos` → `realApi.getVideos()`

### TimelineScreen
- `mockData.timeline` → `realApi.getTimeline()`

### MainTabs
- `mockData.weddingInfo` in header → Load from API

## 📝 Notes
- All API calls need `userPhone` from AsyncStorage
- Photo upload needs FormData with image file
- Handle loading states and errors
- Keep fallback to default data if API fails

