# Mobile App API Integration Guide

## Step 1: Install Dependencies

```bash
cd mobile_app
npm install axios @react-native-async-storage/async-storage
```

## Step 2: Configure API URL

Edit `src/config/api.js` and update the dev API URL:

```javascript
dev: {
  apiUrl: 'http://YOUR_COMPUTER_IP:3002/api', // e.g., 'http://192.168.1.100:3002/api'
  // Or use VPS: 'http://your_vps_ip:3002/api'
  // Or use domain: 'https://jsang-psong-wedding.com/api'
},
```

**To find your computer's IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

## Step 3: Add API Test Screen to App.js

Add this import at the top of `App.js`:
```javascript
import ApiTestScreen from './src/screens/ApiTestScreen';
```

Add this screen to your Stack Navigator (inside `MainNavigator` function):
```javascript
<Stack.Screen 
  name="ApiTest" 
  component={ApiTestScreen} 
  options={{ 
    title: 'API Test',
    headerStyle: { backgroundColor: '#FF6B9D' },
    headerTintColor: '#fff',
  }} 
/>
```

Add a button in Settings screen to navigate to test:
```javascript
<TouchableOpacity
  style={styles.settingItem}
  onPress={() => navigation.navigate('ApiTest')}
>
  <Icon name="flask" size={24} color={currentTheme.primary} />
  <Text style={styles.settingText}>Test API Connection</Text>
  <Icon name="chevron-right" size={20} color={currentTheme.textLight} />
</TouchableOpacity>
```

## Step 4: Test API Connection

1. **Start your API server** (if testing locally):
   ```bash
   cd api
   npm start
   ```

2. **Start mobile app**:
   ```bash
   cd mobile_app
   npx expo start
   ```

3. **Open app on your phone** (must be on same WiFi as computer)

4. **Navigate to Settings → Test API Connection**

5. **Run tests**:
   - Health Check - Should return "OK"
   - Admin Login - Should return success with email
   - Get RSVPs - Should return list of RSVPs
   - Check Auth - Should show if logged in
   - Test RSVP Submit - Should create a new RSVP

## Step 5: Switch from Mock to Real API

Once API tests pass, update screens to use real API:

### Example: Update Home Screen

**Before (using mock):**
```javascript
import mockApi from '../services/mockApi';

// In component
const loadData = async () => {
  const rsvps = await mockApi.getRSVPs();
  setRsvps(rsvps);
};
```

**After (using real API):**
```javascript
import realApi from '../services/realApi';
import { useApi } from '../hooks/useApi';

// In component
const { data: rsvpsData, loading, error, refetch } = useApi(realApi.getAllRSVPs);

// Use the data
const rsvps = rsvpsData?.rsvps || [];
```

## Step 6: Update Each Screen

### Screens to Update:

1. **HomeScreen** - Load real RSVP counts
2. **PhotoFeedScreen** - Keep using mock for now (Phase 2)
3. **SeatMapScreen** - Keep using mock for now (Phase 2)
4. **VideosScreen** - Keep using mock for now (Phase 2)
5. **TimelineScreen** - Keep using mock for now (Phase 2)

### Priority Updates:

**High Priority (Do Now):**
- RSVP submission
- Admin dashboard (if needed)
- Authentication

**Medium Priority (Phase 2):**
- Photo viewing from database
- Seat map from database
- Videos from database

**Low Priority (Phase 3):**
- Photo upload
- Comments
- Push notifications

## Step 7: Add RSVP Screen

Create a new RSVP screen that uses the real API:

```javascript
import React, { useState } from 'react';
import realApi from '../services/realApi';
import { useMutation } from '../hooks/useApi';

export default function RSVPScreen() {
  const { mutate: submitRSVP, loading } = useMutation(realApi.submitBrideRSVP);
  
  const handleSubmit = async (formData) => {
    try {
      await submitRSVP(formData);
      Alert.alert('Success', 'RSVP submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
  // ... rest of form
}
```

## Step 8: Handle Errors Gracefully

Add error boundaries and fallbacks:

```javascript
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
    <Button title="Retry" onPress={refetch} />
  </View>
)}

{loading && <ActivityIndicator size="large" color="#FF6B9D" />}

{data && (
  // Render your data
)}
```

## Step 9: Test Everything

### Test Checklist:

- [ ] API health check works
- [ ] Admin login works
- [ ] Get RSVPs works
- [ ] Submit RSVP works
- [ ] Error messages show correctly
- [ ] Loading states show correctly
- [ ] App works on both iOS and Android
- [ ] App handles network errors
- [ ] App handles offline mode

## Step 10: Deploy to Production

Once everything works:

1. Update `api.js` to use production URL by default
2. Test with production API
3. Build app for distribution
4. Submit to app stores

## Troubleshooting

### "Network Error" or "Cannot connect"

**Check:**
1. Is API server running?
2. Is phone on same WiFi as computer?
3. Is IP address correct in `api.js`?
4. Is firewall blocking the port?

**Test:**
```bash
# On your phone's browser, visit:
http://YOUR_COMPUTER_IP:3002/health
```

### "401 Unauthorized"

**Solution:**
- Login first using Admin Login test
- Check that auth tokens are saved in AsyncStorage

### "CORS Error"

**Solution:**
- Make sure API has CORS enabled (it should already)
- Check API server logs

### "Timeout"

**Solution:**
- Increase timeout in `realApi.js`
- Check network connection
- Check API server is responding

## API Service Features

### Automatic Auth Headers
- Auth tokens automatically added to requests
- Stored in AsyncStorage
- Persists across app restarts

### Error Handling
- Network errors caught
- Server errors formatted
- 401 errors clear auth automatically

### Loading States
- `useApi` hook provides loading state
- `useMutation` hook for POST/PUT/DELETE
- Easy to show spinners

### Retry Logic
- `refetch()` function to retry failed requests
- Manual retry buttons in UI

## Next Steps

After basic integration:

1. **Phase 2**: Implement photo upload backend
2. **Phase 3**: Add push notifications
3. **Phase 4**: App store submission
4. **Phase 5**: Analytics and monitoring

## Support

If you encounter issues:
1. Check API server logs: `pm2 logs wedding-api`
2. Check mobile app console logs
3. Test API endpoints with curl first
4. Use API Test screen to diagnose

---

**Status**: Ready for integration
**Next**: Run Step 1-4 to test API connection

