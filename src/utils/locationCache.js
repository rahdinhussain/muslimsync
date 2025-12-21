import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@app_location_cache';
const LOCATION_CACHE_MAX_AGE = 3600000; // 1 hour in milliseconds

/**
 * Get cached location or fetch new one
 * @param {boolean} forceRefresh - Force fetch new location even if cache exists
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCachedLocation = async (forceRefresh = false) => {
  try {
    // Request permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission is required.');
    }

    // Try to load from cache first (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
        if (cachedData) {
          const { location: cachedLocation, timestamp } = JSON.parse(cachedData);
          const age = Date.now() - timestamp;
          
          // Use cached location if it's less than 1 hour old
          if (age < LOCATION_CACHE_MAX_AGE) {
            return cachedLocation;
          }
        }
      } catch (cacheError) {
        // Cache error - continue to fetch new location
        console.log('Cache read error:', cacheError);
      }
    }

    // Fetch new location (cache miss or forced refresh)
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const newLocation = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    
    // Save to cache
    try {
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
        location: newLocation,
        timestamp: Date.now(),
      }));
    } catch (saveError) {
      // Cache save error (non-critical)
      console.log('Cache save error:', saveError);
    }
    
    return newLocation;
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

/**
 * Clear cached location
 */
export const clearLocationCache = async () => {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing location cache:', error);
  }
};

/**
 * Get cached location without fetching (returns null if not cached or stale)
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCachedLocationOnly = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cachedData) {
      const { location: cachedLocation, timestamp } = JSON.parse(cachedData);
      const age = Date.now() - timestamp;
      
      // Return cached location if it's less than 1 hour old
      if (age < LOCATION_CACHE_MAX_AGE) {
        return cachedLocation;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if cached location exists and is valid
 * @returns {Promise<boolean>}
 */
export const hasValidCachedLocation = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cachedData) {
      const { timestamp } = JSON.parse(cachedData);
      const age = Date.now() - timestamp;
      return age < LOCATION_CACHE_MAX_AGE;
    }
    return false;
  } catch (error) {
    return false;
  }
};


