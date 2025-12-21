# Build and Publish Guide for Muslim Sync

This guide will walk you through building, testing, and publishing your app to the App Store and Google Play Store.

## Prerequisites

1. **EAS CLI installed** (already in your package.json)
2. **Expo account** - Sign up at https://expo.dev if you haven't already
3. **Apple Developer account** (for iOS) - $99/year
4. **Google Play Developer account** (for Android) - $25 one-time fee

---

## Step 1: Install EAS CLI (if not already installed globally)

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

This will prompt you to log in with your Expo account or create one.

## Step 3: Configure Your Project

### 3.1 Initialize EAS (if not already done)

```bash
eas build:configure
```

This should detect your existing `eas.json` and ask if you want to use it. Say yes.

### 3.2 Update app.json (if needed)

Your `app.json` looks good, but verify:
- Bundle identifier (iOS): `com.muslimsync.app`
- Package name (Android): `com.muslimsync.app`
- Version: `1.0.0`
- Icon and splash assets exist in `./assets/`

---

## Step 4: Build for Testing (Development Build)

### For iOS (iPhone):

```bash
eas build --profile development --platform ios
```

### For Android:

```bash
eas build --profile development --platform android
```

**Note**: Development builds allow you to test on your device. They'll create a build you can install via TestFlight (iOS) or direct download (Android).

---

## Step 5: Install Development Build on Your Phone

### iOS (via TestFlight):

1. After the build completes, you'll get a TestFlight link
2. Open the link on your iPhone
3. Install TestFlight app if needed
4. Accept the invitation and install the app
5. Run `expo start --dev-client` on your computer to connect

### Android:

1. After the build completes, you'll get a download link
2. Download the `.apk` file on your Android device
3. Enable "Install from unknown sources" in Android settings
4. Install the `.apk` file
5. Run `expo start --dev-client` on your computer to connect

---

## Step 6: Test Your App Thoroughly

Test all features:
- ✅ Prayer times calculation
- ✅ Quran reading and audio
- ✅ Dua categories and audio
- ✅ Dhikr counter
- ✅ Mosque finder
- ✅ Qibla compass
- ✅ Offline functionality
- ✅ Theme switching
- ✅ All navigation flows

---

## Step 7: Build for Production

Once you've tested and everything works:

### For iOS:

```bash
eas build --profile production --platform ios
```

**Requirements for iOS:**
- You need an Apple Developer account ($99/year)
- EAS will guide you through creating certificates and provisioning profiles
- The build will be ready for App Store submission

### For Android:

```bash
eas build --profile production --platform android
```

**Requirements for Android:**
- You need a Google Play Developer account ($25 one-time)
- You may need to create a keystore (EAS can handle this)
- The build will be ready for Google Play submission

---

## Step 8: Submit to App Stores

### iOS - App Store:

1. **Build completes** → You'll get an `.ipa` file
2. **Submit automatically:**
   ```bash
   eas submit --platform ios
   ```
   This will upload to App Store Connect

3. **Or manually:**
   - Go to https://appstoreconnect.apple.com
   - Create a new app listing
   - Fill in app information:
     - Name: Muslim Sync
     - Category: Lifestyle or Reference
     - Description
     - Screenshots (required - take screenshots from your app)
     - Privacy Policy URL (required)
     - App Icon
   - Upload the build
   - Submit for review

### Android - Google Play:

1. **Build completes** → You'll get an `.aab` (Android App Bundle) file
2. **Submit automatically:**
   ```bash
   eas submit --platform android
   ```
   This will upload to Google Play Console

3. **Or manually:**
   - Go to https://play.google.com/console
   - Create a new app
   - Fill in app information:
     - Name: Muslim Sync
     - Category: Lifestyle
     - Description
     - Screenshots (required)
     - Feature graphic
     - Privacy Policy URL (required)
   - Upload the `.aab` file
   - Submit for review

---

## Important Notes

### Before Submitting:

1. **Create a Privacy Policy** (Required for both stores)
   - You can use a generator or write one
   - Must mention:
     - Location data usage
     - Data storage (AsyncStorage)
     - Third-party services (Supabase, APIs)
   - Host it on muslimsync.com or use a free hosting service

2. **App Store Requirements:**
   - Screenshots for different device sizes (iPhone 6.7", 6.5", 5.5")
   - App description (up to 4000 characters)
   - Keywords
   - Support URL (muslimsync.com)
   - Marketing URL (optional)
   - Privacy Policy URL (required)

3. **Google Play Requirements:**
   - Feature graphic (1024 x 500 px)
   - Screenshots (at least 2, up to 8)
   - Short description (80 characters)
   - Full description (4000 characters)
   - Privacy Policy URL (required)

4. **Version Management:**
   - Update version in `app.json` before each new build
   - iOS: version format `1.0.0` (build number auto-increments)
   - Android: version code increments with each build

---

## Quick Commands Reference

```bash
# Login
eas login

# Build for development (testing)
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to stores (after production build)
eas submit --platform ios
eas submit --platform android

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]
```

---

## Troubleshooting

### Build Fails:

1. Check the build logs in the Expo dashboard
2. Common issues:
   - Missing assets (icon, splash)
   - Invalid bundle identifier/package name
   - Code signing issues (iOS)
   - Missing permissions in app.json

### Can't Install on Device:

1. **iOS**: Make sure device is registered in Apple Developer account
2. **Android**: Enable "Install from unknown sources"

### Submission Rejected:

1. **Missing Privacy Policy**: Required for both stores
2. **Incomplete App Information**: Fill in all required fields
3. **App Crashes**: Test thoroughly before submitting
4. **Guideline Violations**: Review App Store/Play Store guidelines

---

## Next Steps After Publishing

1. Monitor crash reports in Expo dashboard
2. Collect user feedback
3. Update app regularly with new features
4. Respond to reviews on app stores
5. Update version in `app.json` for each update

---

## Support

- Expo Documentation: https://docs.expo.dev/build/introduction/
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

Good luck with your app launch! 🚀


