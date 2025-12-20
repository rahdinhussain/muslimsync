# Muslim Sync - Islamic App

A comprehensive React Native app built with Expo for Muslims to track prayer times, read Quran, perform Dhikr, find mosques, and more.

## Features

- 🕌 **Prayer Time Tracker** - Accurate prayer times based on your location
- 📖 **Quran Reader** - Browse and read the Holy Quran
- 💚 **Dhikr Counter** - Track your daily remembrance with counters
- 🗺️ **Mosque Finder** - Discover mosques near you
- ⏰ **Mosque Prayer Schedules** - View individual mosque prayer time schedules

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator, or Expo Go app on your phone

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
Muslim Sync/
├── App.js                 # Main app component with navigation
├── src/
│   └── screens/
│       ├── HomeScreen.js           # Home screen with quick actions
│       ├── PrayerTimesScreen.js    # Prayer times tracker
│       ├── QuranScreen.js          # Quran reader
│       ├── DhikrScreen.js          # Dhikr counter
│       ├── MosqueFinderScreen.js   # Mosque finder
│       └── MosqueScheduleScreen.js # Individual mosque schedules
├── assets/                # Images and icons (create this folder)
└── package.json
```

## Features in Detail

### Prayer Times
- Location-based prayer time calculations
- View prayer times for any date
- Next prayer notification
- Uses Aladhan API for accurate calculations

### Quran
- Browse all 114 surahs
- Search functionality
- Arabic text with transliteration
- (Note: Full Quran text integration needed - can use quran.com API)

### Dhikr
- Multiple categories (Morning, Evening, General)
- Counter for each dhikr
- Progress tracking
- Persistent storage

### Mosque Finder
- Find mosques near your location
- View mosque details
- Get directions
- Call mosque directly
- View prayer schedules

## API Integration Notes

The app currently uses:
- **Aladhan API** for prayer times (https://aladhan.com/prayer-times-api)
- Sample data for mosques (integrate with Google Places API for production)
- Sample data for Quran (integrate with quran.com API or similar for full text)

## Customization

### Colors
The app uses a green color scheme representing Islamic themes:
- Primary: `#1a472a` (Dark Green)
- Secondary: `#2d8659` (Medium Green)
- Accent: `#4a7c59` (Light Green)

### Adding More Features
The app structure is designed to be easily extensible. You can add:
- Qibla compass
- Hadith collection
- Islamic calendar
- Fasting tracker
- Charity calculator
- And more!

## Assets Needed

Create an `assets` folder and add:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1242x2436) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon

## Permissions

The app requires:
- Location permission (for prayer times and mosque finder)

## Future Enhancements

- [ ] Push notifications for prayer times
- [ ] Audio recitation of Quran
- [ ] Offline mode
- [ ] Multiple calculation methods
- [ ] Widget support
- [ ] Dark mode
- [ ] Multiple languages
- [ ] User accounts and sync

## License

This project is open source and available for personal and commercial use.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.






