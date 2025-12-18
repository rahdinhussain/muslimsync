# Troubleshooting Expo Go Timeout Issues

## If the app times out in Expo Go:

### 1. **Clear Everything and Restart**
```bash
# Kill any running processes
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Clear cache and restart
rm -rf node_modules .expo
npm install
npx expo start --clear
```

### 2. **Check Network Connection**
- Ensure your phone and computer are on the **same Wi-Fi network**
- Try using tunnel mode: `npx expo start --tunnel`
- Check if your firewall is blocking the connection

### 3. **Update Expo Go**
- Make sure you have the latest version of Expo Go from the App Store/Play Store
- The app requires Expo SDK 54

### 4. **Try Development Build Instead**
Expo Go has limitations with complex apps. Consider using a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for development
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### 5. **Check Terminal Output**
Look for any error messages in the terminal when starting:
- Bundle size warnings
- Network errors
- Module resolution errors

### 6. **Test with Minimal App**
Temporarily comment out screens to identify which component is causing issues:

```javascript
// In App.js, comment out problematic screens
// import QuranScreen from './src/screens/QuranScreen';
```

### 7. **Check Device Storage**
- Ensure your device has enough storage
- Clear Expo Go cache: Settings > Apps > Expo Go > Clear Cache

### 8. **Alternative: Use Simulator/Emulator**
Instead of Expo Go on a physical device:
- iOS: `npx expo start --ios`
- Android: `npx expo start --android`

## Common Causes:
1. **Bundle too large** - Expo Go has size limitations
2. **Network issues** - Firewall or network configuration
3. **Expo Go version mismatch** - Update Expo Go app
4. **Too many dependencies** - Some native modules don't work in Expo Go
5. **Blocking operations** - Heavy computations on startup

## Solution: Development Build
For production apps with many features, a development build is recommended over Expo Go.


