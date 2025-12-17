import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { GOOGLE_PLACES_API_KEY, isGooglePlacesKeySet } from '../config/apiKeys';

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Format distance for display
const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

export default function MosqueFinderScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      // Request location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to find nearby mosques. Please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setLoading(false);
        return;
      }

      let locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData.coords);
      await fetchNearbyMosques(locationData.coords.latitude, locationData.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
      setLoading(false);
    }
  };

  const fetchNearbyMosques = async (latitude, longitude) => {
    try {
      setLoading(true);
      
      // Check if API key is set
      if (!isGooglePlacesKeySet()) {
        Alert.alert(
          'API Key Required',
          'Google Places API key is not configured. Please add your API key in src/config/apiKeys.js\n\n' +
          'To get a free API key:\n' +
          '1. Go to https://console.cloud.google.com/\n' +
          '2. Create a project and enable "Places API"\n' +
          '3. Create an API key in Credentials\n' +
          '4. Add it to src/config/apiKeys.js',
          [{ text: 'OK' }]
        );
        setLoading(false);
        setMosques([]);
        return;
      }
      
      // Search for mosques using Google Places API
      const radius = 5000; // 5km radius
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=mosque&keyword=mosque&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        // Fetch detailed information including phone numbers
        const mosquesWithDetails = await Promise.all(
          data.results.map(async (place) => {
            // Get place details for phone number
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,geometry,place_id&key=${GOOGLE_PLACES_API_KEY}`;
            
            try {
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();
              
              if (detailsData.status === 'OK' && detailsData.result) {
                const placeDetails = detailsData.result;
                const placeLat = placeDetails.geometry?.location?.lat || place.geometry.location.lat;
                const placeLng = placeDetails.geometry?.location?.lng || place.geometry.location.lng;
                const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
                
                return {
                  id: place.place_id,
                  name: placeDetails.name || place.name,
                  address: placeDetails.formatted_address || place.vicinity || 'Address not available',
                  distance: formatDistance(distance),
                  distanceValue: distance, // For sorting
                  latitude: placeLat,
                  longitude: placeLng,
                  phone: placeDetails.formatted_phone_number || null,
                  placeId: place.place_id,
                };
              }
            } catch (error) {
              console.error('Error fetching place details:', error);
            }
            
            // Fallback if details fetch fails
            const placeLat = place.geometry.location.lat;
            const placeLng = place.geometry.location.lng;
            const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
            
            return {
              id: place.place_id,
              name: place.name,
              address: place.vicinity || 'Address not available',
              distance: formatDistance(distance),
              distanceValue: distance,
              latitude: placeLat,
              longitude: placeLng,
              phone: null,
              placeId: place.place_id,
            };
          })
        );

        // Sort by distance (closest first)
        mosquesWithDetails.sort((a, b) => a.distanceValue - b.distanceValue);
        
        setMosques(mosquesWithDetails);
      } else if (data.status === 'ZERO_RESULTS') {
        setMosques([]);
        Alert.alert('No Results', 'No mosques found nearby. Try expanding your search area.');
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Google Places API error:', data.status, data.error_message);
        Alert.alert(
          'API Key Error',
          `The Google Places API key is invalid or not properly configured.\n\n` +
          `Error: ${data.error_message || data.status}\n\n` +
          `Please check:\n` +
          `1. Your API key in src/config/apiKeys.js\n` +
          `2. That "Places API" is enabled in Google Cloud Console\n` +
          `3. That your API key has proper restrictions/permissions`
        );
        setMosques([]);
      } else {
        console.error('Google Places API error:', data.status, data.error_message);
        Alert.alert('Error', `Failed to fetch mosques: ${data.error_message || data.status}`);
        setMosques([]);
      }
    } catch (error) {
      console.error('Error fetching mosques:', error);
      Alert.alert('Error', 'Failed to fetch nearby mosques. Please check your internet connection and try again.');
      setMosques([]);
    } finally {
      setLoading(false);
    }
  };

  const openDirections = (mosque) => {
    const { latitude, longitude, name } = mosque;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${mosque.placeId}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to regular Google Maps URL
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(fallbackUrl);
      }
    }).catch(err => {
      console.error('Error opening directions:', err);
      Alert.alert('Error', 'Unable to open Google Maps. Please install Google Maps app.');
    });
  };

  const filteredMosques = mosques.filter((mosque) =>
    mosque.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mosque.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    loadingText: {
      marginTop: 10,
      color: colors.textSecondary,
    },
    header: {
      backgroundColor: colors.header,
      padding: 25,
      paddingTop: 10,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: 15,
      borderRadius: 15,
      height: 50,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    mosqueCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    mosqueIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    mosqueName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    mosqueAddress: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 5,
      flex: 1,
    },
    mosqueDistance: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 5,
      fontWeight: '600',
    },
    mosquePhone: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 5,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 10,
    },
    refreshButton: {
      flexDirection: 'row',
      backgroundColor: colors.iconBackground,
      margin: 20,
      padding: 15,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    refreshButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={dynamicStyles.loadingText}>Finding nearby mosques...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Find Mosques</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Discover mosques near you
        </Text>
      </View>

      <View style={dynamicStyles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search mosques..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textTertiary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.mosquesList}>
        {filteredMosques.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.textTertiary} />
            <Text style={dynamicStyles.emptyText}>No mosques found</Text>
          </View>
        ) : (
          filteredMosques.map((mosque) => (
            <View key={mosque.id} style={dynamicStyles.mosqueCard}>
              <View style={styles.mosqueCardContent}>
                <View style={dynamicStyles.mosqueIcon}>
                  <Ionicons name="location" size={28} color={colors.text} />
                </View>
                <TouchableOpacity
                  style={styles.mosqueInfo}
                  onPress={() =>
                    navigation.navigate('MosqueSchedule', { mosque })
                  }
                >
                  <Text style={dynamicStyles.mosqueName}>{mosque.name}</Text>
                  <View style={styles.mosqueDetails}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={dynamicStyles.mosqueAddress}>{mosque.address}</Text>
                  </View>
                  <View style={styles.mosqueDetails}>
                    <Ionicons name="navigate" size={14} color={colors.textSecondary} />
                    <Text style={dynamicStyles.mosqueDistance}>{mosque.distance} away</Text>
                  </View>
                  {mosque.phone && (
                    <View style={styles.mosqueDetails}>
                      <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                      <Text style={dynamicStyles.mosquePhone}>{mosque.phone}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.directionsButton, { backgroundColor: colors.cardSecondary }]}
                onPress={() => openDirections(mosque)}
              >
                <Ionicons name="navigate" size={18} color={colors.text} />
                <Text style={[styles.directionsButtonText, { color: colors.text }]}>Directions</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={dynamicStyles.refreshButton}
        onPress={getLocation}
      >
        <Ionicons name="refresh" size={20} color={colors.text} />
        <Text style={dynamicStyles.refreshButtonText}>Refresh Location</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    marginRight: 10,
  },
  mosquesList: {
    flex: 1,
    padding: 20,
  },
  mosqueCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  mosqueInfo: {
    flex: 1,
  },
  mosqueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});

