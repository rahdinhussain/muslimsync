# Development Build Guide

## Option 1: Try Tunnel Mode First (Easiest)

Before building, try tunnel mode which uses Expo's servers:

```bash
npx expo start --tunnel --clear
```

This should work even if your phone and computer are on different networks.

## Option 2: Create Development Build

If tunnel mode doesn't work, create a development build:

### Step 1: Login to Expo
```bash
npx eas login
```

### Step 2: Configure EAS
```bash
npx eas build:configure
```

### Step 3: Build for Your Platform

**For iOS:**
```bash
npx eas build --profile development --platform ios
```

**For Android:**
```bash
npx eas build --profile development --platform android
```

### Step 4: Install the Build

After the build completes:
- **iOS**: Download from the provided link and install via TestFlight or direct download
- **Android**: Download the APK from the provided link and install on your device

### Step 5: Start Development Server

Once the build is installed on your device:
```bash
npx expo start --dev-client
```

Then scan the QR code with your development build app (not Expo Go).

## Alternative: Use Simulator/Emulator

If you have Xcode (Mac) or Android Studio:

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

## Troubleshooting

### Build Fails?
- Make sure you're logged in: `npx eas login`
- Check your `app.json` has correct bundle identifier/package name
- Ensure you have an Expo account (free)

### Still Timing Out?
- The app might be too complex for Expo Go
- Development build is the recommended solution
- Or use simulator/emulator for testing


