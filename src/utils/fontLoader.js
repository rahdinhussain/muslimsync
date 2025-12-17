import * as Font from 'expo-font';
import { Platform } from 'react-native';

// Font family names mapping
// Will be updated to custom fonts if loaded, otherwise use system fonts
export let FONT_FAMILIES = {
  system: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  uthmani: Platform.select({
    ios: 'Arial Hebrew', // Good Arabic support on iOS
    android: 'serif', // Serif fonts on Android support Arabic well
    default: 'System',
  }),
  naskh: Platform.select({
    ios: 'Arial', // Good Arabic support
    android: 'sans-serif', // Default sans-serif supports Arabic
    default: 'System',
  }),
  nastaliq: Platform.select({
    ios: 'Arial Hebrew', // Closest to Nastaliq on iOS
    android: 'serif', // Serif for Nastaliq-like appearance
    default: 'System',
  }),
};

// Load custom fonts if available (for future use)
let fontsLoaded = false;

export const loadArabicFonts = async () => {
  if (fontsLoaded) return true;

  try {
    // Try to load custom fonts if they exist
    const fontMap = {
      'Amiri-Regular': require('../../assets/fonts/Amiri-Regular.ttf'),
      'Amiri-Bold': require('../../assets/fonts/Amiri-Bold.ttf'),
      'NotoSansArabic-Regular': require('../../assets/fonts/NotoSansArabic-Regular.ttf'),
    };
    
    // Try to load Nastaliq if it exists (optional)
    try {
      fontMap['NotoNastaliqUrdu-Regular'] = require('../../assets/fonts/NotoNastaliqUrdu-Regular.ttf');
    } catch (e) {
      // Nastaliq not available, that's okay
    }
    
    try {
      await Font.loadAsync(fontMap);
      
      // Update font families to use custom fonts
      FONT_FAMILIES.uthmani = 'Amiri-Regular';
      FONT_FAMILIES.naskh = 'NotoSansArabic-Regular';
      
      // Only set Nastaliq if it was loaded
      if (fontMap['NotoNastaliqUrdu-Regular']) {
        FONT_FAMILIES.nastaliq = 'NotoNastaliqUrdu-Regular';
      }
      
      console.log('Custom Arabic fonts loaded successfully');
      fontsLoaded = true;
      return true;
    } catch (fontError) {
      // Custom fonts not found, use system fonts
      console.log('Custom fonts not found, using system fonts:', fontError.message);
      fontsLoaded = true;
      return true;
    }
  } catch (error) {
    console.error('Error loading fonts:', error);
    fontsLoaded = true; // Still return true to not block app
    return true;
  }
};

export const getFontFamily = (fontId) => {
  return FONT_FAMILIES[fontId] || FONT_FAMILIES.system;
};

