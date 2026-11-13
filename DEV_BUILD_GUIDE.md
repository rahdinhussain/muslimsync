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
- **iOS**: Install from the EAS build-page link on a registered device included in the ad hoc provisioning profile. TestFlight uses a separate store build and upload workflow.
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

### iOS: "Developer Mode Required" Message

If you see "Developer Mode Required" when opening the app on your iPhone:

**Step 1: Enable Developer Mode**
1. Open **Settings** on your iPhone
2. Go to **Privacy & Security** (or just **Privacy** on older iOS versions)
3. Scroll down and tap **Developer Mode**
4. Toggle **Developer Mode** to **ON**
5. Your phone will restart (this is normal)

**Step 2: Trust the Developer Certificate**
1. After restart, go to **Settings** > **General** > **VPN & Device Management** (or **Device Management**)
2. You should see a profile under "Developer App" section
3. Tap on it and tap **Trust "[Your Developer Name]"**
4. Confirm by tapping **Trust**

**Step 3: Open the App**
- Now you should be able to open the app without the Developer Mode error

**Note:** Developer Mode is only available on iOS 16 and later. If you're on iOS 15 or earlier, you'll need to update your device.

### Build Fails?
- Make sure you're logged in: `npx eas login`
- Check your `app.json` has correct bundle identifier/package name
- Ensure you have an Expo account (free)

### "No Development Server Found" Error

If you see "No development server found" when opening the app:

1. **Make sure the development server is running:**
   ```bash
   npx expo start --dev-client
   ```
   Or with cleared cache:
   ```bash
   npx expo start --dev-client --clear
   ```

2. **Ensure your phone and computer are on the same Wi-Fi network**

3. **If on different networks, use tunnel mode:**
   ```bash
   npx expo start --dev-client --tunnel
   ```

4. **In the app, you can:**
   - Scan the QR code that appears in the terminal
   - Or manually enter the connection URL shown in the terminal
   - The URL will look like: `exp://192.168.x.x:8081` or `exp://xxx.xxx.xxx.xxx:8081` (for tunnel)

5. **If still not connecting:**
   - Check your firewall settings
   - Ensure port 8081 is not blocked
   - Try restarting the development server

### Still Timing Out?
- The app might be too complex for Expo Go
- Development build is the recommended solution
- Or use simulator/emulator for testing






