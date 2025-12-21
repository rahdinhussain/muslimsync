# Running in Expo Go - Step by Step Guide

## Prerequisites
1. **Install Expo Go** on your phone:
   - iOS: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Ensure your phone and computer are on the same Wi-Fi network**

## Steps to Run

### Step 1: Start the Development Server
```bash
cd "/Users/rahdi/Muslim Sync"
npx expo start --clear
```

### Step 2: Wait for QR Code
After running the command, you'll see:
- A QR code in the terminal
- A URL like `exp://192.168.x.x:8081`

### Step 3: Open Expo Go on Your Phone
- Open the **Expo Go** app on your phone

### Step 4: Scan the QR Code
**For iOS:**
- Use the built-in Camera app to scan the QR code
- Tap the notification that appears

**For Android:**
- Open Expo Go app
- Tap "Scan QR code"
- Scan the QR code from terminal

### Step 5: Wait for App to Load
- The app will start downloading/loading
- This may take 30-60 seconds
- If it times out, see troubleshooting below

## Alternative Methods

### Method 1: Manual Connection
If QR code doesn't work:
1. In Expo Go, tap "Enter URL manually"
2. Enter the URL shown in terminal (e.g., `exp://192.168.1.100:8081`)

### Method 2: Tunnel Mode (If Same Network Doesn't Work)
```bash
npx expo start --tunnel --clear
```
This uses Expo's servers and works even on different networks.

### Method 3: Use Expo Go's "Recent Projects"
After first successful connection, the app appears in "Recent Projects" in Expo Go.

## Troubleshooting

### App Times Out / Won't Load

**Try these in order:**

1. **Clear Expo Go Cache:**
   - iOS: Settings > Expo Go > Clear Cache
   - Android: Settings > Apps > Expo Go > Storage > Clear Cache

2. **Restart Everything:**
   ```bash
   # Kill the server
   lsof -ti:8081 | xargs kill -9
   
   # Clear and restart
   npx expo start --clear
   ```

3. **Check Network:**
   - Ensure phone and computer are on same Wi-Fi
   - Try disabling VPN if active
   - Try a different Wi-Fi network

4. **Update Expo Go:**
   - Make sure you have the latest version from App Store/Play Store
   - The app requires Expo SDK 54

5. **Try Tunnel Mode:**
   ```bash
   npx expo start --tunnel --clear
   ```

6. **Check Terminal for Errors:**
   - Look for any error messages
   - Check if bundle is building successfully
   - Look for network errors

### Common Issues

**"Unable to connect to server"**
- Check firewall settings
- Ensure port 8081 is not blocked
- Try tunnel mode

**"Bundle failed to load"**
- Clear cache: `npx expo start --clear`
- Check internet connection
- Restart Expo Go app

**"App crashes on startup"**
- Check terminal for error messages
- Try clearing Expo Go cache
- Restart the development server

## If Nothing Works

If Expo Go keeps timing out, the app might be too complex for Expo Go. Consider:

1. **Use Simulator/Emulator:**
   ```bash
   npx expo start --ios      # iOS Simulator
   npx expo start --android # Android Emulator
   ```

2. **Create Development Build:**
   - See `DEV_BUILD_GUIDE.md` for instructions
   - This is the recommended solution for complex apps

## Quick Commands Reference

```bash
# Start normally
npx expo start

# Start with cleared cache
npx expo start --clear

# Start with tunnel (works across networks)
npx expo start --tunnel

# Start for iOS Simulator
npx expo start --ios

# Start for Android Emulator
npx expo start --android

# Kill server if stuck
lsof -ti:8081 | xargs kill -9
```







