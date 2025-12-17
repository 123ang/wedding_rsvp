# Xcode Archive Sandbox Errors - Debug Guide

## Problem
When archiving your iOS app in Xcode, you're getting sandbox permission errors:
- `Sandbox: find(21441) deny(1) file-read-data /Users/kevinsoon/Documents/GitHub...`
- `Sandbox: node(21399) deny(1) file-write-create /Users/kevinsoon/Library/Developer/...`

## Root Cause
These errors occur when build scripts try to access files outside the project directory or use absolute paths that the macOS sandbox restricts.

## Fixes Applied

### ✅ Fix 1: Updated `.xcode.env.local`
Changed from absolute path to relative command:
```bash
# Before (BAD):
export NODE_BINARY=/opt/homebrew/Cellar/node@20/20.19.3/bin/node

# After (GOOD):
export NODE_BINARY=$(command -v node)
```

### ✅ Fix 2: Cleaned Build Folders
Removed cached build artifacts that might have incorrect paths.

## Additional Solutions

### Solution 1: Use EAS Build (Recommended for Production)
Instead of archiving locally, use Expo's cloud build service:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (if not already done)
eas build:configure

# Build for iOS
eas build --platform ios --profile production
```

This avoids local sandbox issues entirely.

### Solution 2: Archive from Command Line
Sometimes Xcode GUI has more restrictions than command line:

```bash
cd /Users/kevinsoon/Documents/GitHub/wedding_rsvp/mobile_app/ios

# Clean first
xcodebuild clean -workspace JSPSWedding.xcworkspace -scheme JSPSWedding

# Archive
xcodebuild archive \
  -workspace JSPSWedding.xcworkspace \
  -scheme JSPSWedding \
  -configuration Release \
  -archivePath ./build/JSPSWedding.xcarchive \
  -allowProvisioningUpdates
```

### Solution 3: Check Build Phase Scripts
In Xcode, check if any Build Phases have scripts with absolute paths:

1. Open `ios/JSPSWedding.xcworkspace` in Xcode
2. Select the `JSPSWedding` target
3. Go to "Build Phases" tab
4. Check all "Run Script" phases
5. Ensure they use relative paths like `$(SRCROOT)` or `$(PROJECT_DIR)`

### Solution 4: Verify Node Path
Ensure your `.xcode.env.local` uses a command that works:

```bash
# Test the command
cd /Users/kevinsoon/Documents/GitHub/wedding_rsvp/mobile_app/ios
command -v node

# Should output something like: /opt/homebrew/bin/node
```

### Solution 5: Check CocoaPods
Sometimes CocoaPods scripts have issues:

```bash
cd /Users/kevinsoon/Documents/GitHub/wedding_rsvp/mobile_app/ios

# Reinstall pods
pod deintegrate
pod install

# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Solution 6: Xcode Build Settings
Check these settings in Xcode:

1. **Build Settings → User Script Sandboxing**: Try disabling this (if available)
2. **Build Settings → Enable Bitcode**: Set to `NO` (Bitcode is deprecated)
3. **Build Settings → Always Embed Swift Standard Libraries**: Set to `YES`

## Testing the Fix

1. **Clean Build Folder**:
   - In Xcode: Product → Clean Build Folder (Shift+Cmd+K)
   - Or: `cd ios && xcodebuild clean`

2. **Try Archiving Again**:
   - Product → Archive
   - Or use command line method above

3. **If Still Failing**:
   - Check the full error log in Xcode's Issue Navigator
   - Look for which specific file/script is causing the issue
   - Share the complete error message for further debugging

## Alternative: Use Expo Development Build

If you just need to test on a device, use Expo's development build:

```bash
# Build development client
eas build --platform ios --profile development

# Install on device via TestFlight or direct install
```

## Common Issues

### Issue: "NODE_BINARY not found"
**Fix**: Ensure Node is in your PATH:
```bash
echo $PATH | grep -o '/[^:]*node[^:]*'
```

### Issue: "Pod install fails"
**Fix**: 
```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
```

### Issue: "Metro bundler can't find files"
**Fix**: Ensure you're running from the project root:
```bash
cd /Users/kevinsoon/Documents/GitHub/wedding_rsvp/mobile_app
npx expo start --clear
```

## Next Steps

1. ✅ Fixed `.xcode.env.local` to use relative path
2. ✅ Cleaned build folders
3. ⏭️ Try archiving again in Xcode
4. ⏭️ If it still fails, try EAS Build (Solution 1)
5. ⏭️ If using EAS, update `eas.json` with your Apple Developer credentials

## Need More Help?

If the issue persists:
1. Share the complete error log from Xcode
2. Check which specific build phase is failing
3. Consider using EAS Build for production builds (most reliable)

