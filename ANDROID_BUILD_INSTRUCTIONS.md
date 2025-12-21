# Android Build Instructions

## Step 1: Start the Build

Run this command in your terminal:

```bash
npx eas build --profile development --platform android
```

## What Happens Next:

1. **EAS will ask you questions:**
   - "Would you like to create a new keystore?" → Answer: **Yes** (or "y")
   - This keystore is used to sign your app
   - EAS will store it securely for you

2. **Build Process:**
   - The build will happen in the cloud (Expo's servers)
   - Takes about 10-20 minutes
   - You'll see progress updates in the terminal

3. **When Build Completes:**
   - You'll get a download link (QR code and URL)
   - The link will look like: `https://expo.dev/artifacts/...`
   - You'll also get an email notification

## Step 2: Install on Your Android Phone

1. **Download the APK:**
   - Open the download link on your Android phone (or scan the QR code)
   - Download the `.apk` file

2. **Enable Unknown Sources:**
   - Go to Settings → Security (or Settings → Apps → Special Access)
   - Enable "Install from Unknown Sources" or "Install Unknown Apps"
   - Select your browser (Chrome, etc.) and allow it

3. **Install the APK:**
   - Tap the downloaded `.apk` file
   - Tap "Install"
   - Wait for installation to complete

## Step 3: Test Your App

Once installed:
- Open the "Muslim Sync" app on your phone
- Test all features thoroughly
- Make sure everything works as expected

## Step 4: Connect for Development (Optional)

If you want to connect to your development server:

```bash
npx expo start --dev-client
```

This allows you to:
- See console logs
- Make code changes and see updates (with fast refresh)
- Debug your app

## Troubleshooting

### Build Fails:
- Check the error message in the terminal
- Common issues:
  - Missing app icon or splash screen
  - Invalid package name (should be `com.muslimsync.app`)
  - Build timeout (just retry)

### Can't Install APK:
- Make sure "Unknown Sources" is enabled
- Try downloading directly on phone instead of transferring
- Check file permissions

### App Crashes:
- Check the build logs
- Make sure all dependencies are in package.json
- Test in Expo Go first to identify issues

## Next Steps After Testing

Once you've tested and everything works:

1. **Build for Production:**
   ```bash
   npx eas build --profile production --platform android
   ```

2. **Submit to Google Play Store:**
   - Create Google Play Developer account ($25 one-time)
   - Go to https://play.google.com/console
   - Create new app and upload the production build

Good luck! 🚀


