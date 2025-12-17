# Quick Start Guide

## First Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Add App Assets**
   - Create or download app icons and splash screens
   - Place them in the `assets/` folder:
     - `icon.png` (1024x1024)
     - `splash.png` (1242x2436)
     - `adaptive-icon.png` (1024x1024)
     - `favicon.png` (48x48)

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Device/Simulator**
   - **iOS**: Press `i` in terminal or use iOS Simulator
   - **Android**: Press `a` in terminal or use Android Emulator
   - **Physical Device**: Scan QR code with Expo Go app

## Testing Features

### Prayer Times
- Grant location permission when prompted
- View today's prayer times
- Navigate between dates
- See next prayer countdown

### Quran
- Browse surahs list
- Search for specific surahs
- Tap any surah to view (currently shows placeholder - integrate API for full text)

### Dhikr
- Select a category (Morning, Evening, General)
- Choose a dhikr to count
- Tap "Count" button to increment
- Reset counter when needed
- Counts are saved automatically

### Mosque Finder
- Grant location permission
- View nearby mosques
- Search for mosques
- Tap a mosque to see schedule
- Get directions or call mosque

## Next Steps

1. **Integrate Real APIs**
   - Replace sample mosque data with Google Places API
   - Integrate full Quran text from quran.com API
   - Add audio recitation

2. **Add More Features**
   - Qibla compass
   - Push notifications
   - Offline mode
   - User authentication

3. **Customize**
   - Update colors in StyleSheet
   - Add your branding
   - Customize UI components

## Troubleshooting

**Location not working?**
- Check app permissions in device settings
- Ensure location services are enabled

**App won't start?**
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Build errors?**
- Check Node.js version (should be 14+)
- Update Expo CLI: `npm install -g expo-cli@latest`

