# Phase 4: Building Mobile App for Production

## Overview

This guide covers building the React Native mobile app for production deployment on Android and iOS.

---

## Prerequisites

### Required:
- ✅ Expo CLI installed globally
- ✅ Expo account (free)
- ✅ Node.js 18+ installed
- ✅ All mobile app features tested and working

### For Android:
- Java JDK 11+ installed
- Android Studio (optional, for testing)

### For iOS (Mac only):
- Xcode 14+ installed
- Apple Developer account ($99/year)
- Mac computer

---

## Option 1: Build with EAS (Recommended)

EAS (Expo Application Services) is the easiest way to build production apps.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Configure Project

```bash
cd mobile_app
eas build:configure
```

This creates `eas.json` configuration file.

### Step 4: Build for Android (APK)

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

The build will run on Expo's servers. You'll get a download link when complete.

### Step 5: Build for iOS (IPA)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

**Note**: iOS builds require an Apple Developer account.

### Step 6: Download and Install

- **Android**: Download APK and install directly on device
- **iOS**: Download IPA and install via TestFlight or Xcode

---

## Option 2: Build Locally

### Android APK (Local Build)

1. **Install dependencies**:
   ```bash
   cd mobile_app
   npm install
   ```

2. **Build APK**:
   ```bash
   npx expo build:android -t apk
   ```

3. **Download APK**:
   - Expo will provide a download link
   - Or use: `expo fetch:android`

4. **Install on device**:
   - Transfer APK to Android device
   - Enable "Install from Unknown Sources"
   - Install APK

### iOS IPA (Mac only)

1. **Build IPA**:
   ```bash
   npx expo build:ios
   ```

2. **Download IPA**:
   - Expo will provide a download link
   - Or use: `expo fetch:ios`

3. **Install via Xcode**:
   - Open Xcode
   - Window → Devices and Simulators
   - Drag IPA to device

---

## Option 3: Standalone Native Build

For full control, eject to bare React Native:

```bash
cd mobile_app
npx expo prebuild
```

This creates `android/` and `ios/` folders with native code.

### Build Android APK:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Build iOS IPA:
```bash
cd ios
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release
```

---

## Configuration Before Building

### 1. Update API URL

Edit `mobile_app/src/config/api.js`:

```javascript
const ENV = {
  dev: {
    apiUrl: 'http://192.168.1.100:3002/api',
  },
  staging: {
    apiUrl: 'https://jsang-psong-wedding.com/api',
  },
  prod: {
    apiUrl: 'https://jsang-psong-wedding.com/api', // Production URL
  },
};
```

### 2. Update app.json

```json
{
  "expo": {
    "name": "JS ♥ PS Wedding",
    "slug": "jsps-wedding",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.jspswedding.app",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.jspswedding.app",
      "versionCode": 1
    }
  }
}
```

### 3. Create App Icons

**Required sizes:**

- **Icon**: 1024x1024 PNG (no transparency)
- **Adaptive Icon** (Android): 1024x1024 PNG
- **Splash Screen**: 1284x2778 PNG

Place in `mobile_app/assets/`:
- `icon.png`
- `adaptive-icon.png`
- `splash.png`

**Quick way to generate**:
```bash
npx expo-icon-builder
```

---

## Testing Production Build

### Android:
1. Install APK on physical device
2. Test all features
3. Check API connectivity
4. Test photo upload
5. Test offline behavior

### iOS:
1. Install via TestFlight
2. Test on multiple iOS versions
3. Check all features
4. Verify push notifications (if added)

---

## Publishing to App Stores

### Google Play Store (Android)

1. **Create Google Play Developer Account** ($25 one-time fee)

2. **Prepare Store Listing**:
   - App name: "JS ♥ PS Wedding"
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (at least 2)
   - Feature graphic (1024x500)
   - App icon (512x512)

3. **Upload AAB**:
   - Build AAB: `eas build --platform android --profile production`
   - Go to Google Play Console
   - Create new app
   - Upload AAB to Internal Testing
   - Fill in store listing
   - Submit for review

4. **Review Process**: 1-3 days

### Apple App Store (iOS)

1. **Create Apple Developer Account** ($99/year)

2. **Prepare Store Listing**:
   - App name: "JS ♥ PS Wedding"
   - Subtitle (30 chars)
   - Description (4000 chars)
   - Screenshots (required for all device sizes)
   - App icon (1024x1024)

3. **Upload IPA**:
   - Build IPA: `eas build --platform ios --profile production`
   - Open App Store Connect
   - Create new app
   - Upload IPA via Transporter app
   - Fill in store listing
   - Submit for review

4. **Review Process**: 1-7 days

---

## Distribution Without App Stores

### Android (APK Direct Install)

1. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```

2. **Share APK**:
   - Upload to Google Drive
   - Share link with guests
   - Users enable "Install from Unknown Sources"
   - Install APK

### iOS (TestFlight)

1. **Build for TestFlight**:
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Upload to TestFlight**:
   - Automatically uploaded if using EAS
   - Invite testers via email
   - Testers install TestFlight app
   - Install wedding app via TestFlight

---

## Build Checklist

### Pre-Build:
- [ ] All features tested and working
- [ ] API URL set to production
- [ ] App icons created (1024x1024)
- [ ] Splash screen created
- [ ] App name and version set in app.json
- [ ] Bundle identifier/package name set
- [ ] Permissions configured

### Build:
- [ ] Android APK built successfully
- [ ] iOS IPA built successfully (if needed)
- [ ] Build downloaded and tested
- [ ] App installs without errors
- [ ] All features work in production build

### Post-Build:
- [ ] Test on multiple devices
- [ ] Test API connectivity
- [ ] Test photo upload
- [ ] Test RSVP submission
- [ ] Test all navigation
- [ ] Test theme switching

---

## Troubleshooting

### Build Fails

**Check:**
- Node.js version (18+)
- Expo CLI version (latest)
- All dependencies installed
- No syntax errors in code
- app.json is valid JSON

**Solution:**
```bash
# Clear cache
rm -rf node_modules
npm install
npx expo start -c
```

### APK Won't Install

**Check:**
- "Install from Unknown Sources" enabled
- Enough storage space
- Android version supported (5.0+)

### iOS Build Fails

**Check:**
- Apple Developer account active
- Certificates and provisioning profiles valid
- Bundle identifier unique
- Xcode version (14+)

---

## Quick Build Commands

```bash
# Android APK (for testing)
eas build --platform android --profile preview

# Android AAB (for Play Store)
eas build --platform android --profile production

# iOS IPA (for TestFlight)
eas build --platform ios --profile preview

# iOS IPA (for App Store)
eas build --platform ios --profile production

# Build both platforms
eas build --platform all --profile production
```

---

## Recommended Approach for Wedding App

### For Guests (Simplest):

1. **Build Android APK**:
   ```bash
   eas build --platform android --profile preview
   ```

2. **Share via Google Drive**:
   - Upload APK to Google Drive
   - Share link via WhatsApp/WeChat
   - Guests download and install

3. **For iOS users**:
   - Use TestFlight (requires Apple Developer account)
   - Or direct them to use the website instead

### For App Stores (If you want):

1. Build production versions
2. Create store listings
3. Submit for review
4. Wait for approval
5. Share store links

---

## Cost Summary

### Free Option:
- ✅ EAS Build (free tier: 30 builds/month)
- ✅ Direct APK distribution
- ✅ No app store fees

### Paid Options:
- 💰 Google Play Store: $25 one-time
- 💰 Apple App Store: $99/year
- 💰 EAS Pro: $29/month (unlimited builds)

---

## Next Steps

1. ✅ Complete all testing
2. ✅ Update production API URL
3. ✅ Create app icons
4. ✅ Build APK for Android
5. ✅ Test on physical devices
6. ✅ Share with wedding guests
7. ⏳ (Optional) Submit to app stores

---

**Status**: Ready to build
**Estimated Time**: 1-2 hours for first build
**Recommended**: Start with Android APK for testing

