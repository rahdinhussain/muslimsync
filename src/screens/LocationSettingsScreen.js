import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedLocation, clearLocationCache } from '../utils/locationCache';

export default function LocationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [currentCity, setCurrentCity] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadStoredLocation();
  }, []);

  const loadStoredLocation = async () => {
    try {
      setLoading(true);
      
      // Try to load from shared location cache first
      try {
        const cachedLoc = await getCachedLocation(false);
        if (cachedLoc) {
          setCurrentLocation(cachedLoc);
        }
      } catch (cacheError) {
        // Fallback to old storage method
        const lat = await AsyncStorage.getItem('@prayer_location_lat');
        const lng = await AsyncStorage.getItem('@prayer_location_lng');
        
        if (lat && lng) {
          setCurrentLocation({
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          });
        }
      }
      
      // Load city name
      const city = await AsyncStorage.getItem('@prayer_city_name');
      if (city) {
        setCurrentCity(city);
      }
    } catch (error) {
      // Error loading stored location (non-critical)
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    try {
      setUpdating(true);
      
      // Force refresh location (bypass cache)
      const newLocation = await getCachedLocation(true);
      
      if (!newLocation) {
        Alert.alert('Error', 'Failed to get location. Please try again.');
        setUpdating(false);
        return;
      }
      
      const { latitude, longitude } = newLocation;
      
      // Get city name
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const city = address.city || address.subAdministrativeArea || address.administrativeArea || 'Unknown';
          
          // Save to storage
          await AsyncStorage.setItem('@prayer_city_name', city);
          await AsyncStorage.setItem('@prayer_location_lat', String(latitude));
          await AsyncStorage.setItem('@prayer_location_lng', String(longitude));
          
          setCurrentCity(city);
          setCurrentLocation({ latitude, longitude });
          
          Alert.alert('Success', 'Location updated successfully!');
        } else {
          Alert.alert('Error', 'Could not determine city name from location.');
        }
      } catch (geocodeError) {
        if (geocodeError.message && geocodeError.message.includes('rate limit')) {
          Alert.alert('Rate Limit', 'Too many requests. Please try again in a few minutes.');
        } else {
          Alert.alert('Error', 'Failed to get city name. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      backgroundColor: colors.header,
      padding: 25,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    backButton: {
      padding: 5,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      padding: 20,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 10,
      minWidth: 100,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    updateButton: {
      backgroundColor: colors.primary || colors.iconBackground,
      borderRadius: 15,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    updateButtonText: {
      color: isDark ? '#000000' : '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View style={dynamicStyles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={dynamicStyles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>Location</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={dynamicStyles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Location</Text>
        </View>

        <ScrollView style={dynamicStyles.content}>
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Current Location</Text>
            
            {currentCity || currentLocation ? (
              <>
                {currentCity && (
                  <View style={dynamicStyles.infoRow}>
                    <Text style={dynamicStyles.infoLabel}>City:</Text>
                    <Text style={dynamicStyles.infoValue}>{currentCity}</Text>
                  </View>
                )}
                {currentLocation && (
                  <>
                    <View style={dynamicStyles.infoRow}>
                      <Text style={dynamicStyles.infoLabel}>Latitude:</Text>
                      <Text style={dynamicStyles.infoValue}>
                        {currentLocation.latitude.toFixed(6)}
                      </Text>
                    </View>
                    <View style={dynamicStyles.infoRow}>
                      <Text style={dynamicStyles.infoLabel}>Longitude:</Text>
                      <Text style={dynamicStyles.infoValue}>
                        {currentLocation.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                <Text style={dynamicStyles.emptyStateText}>
                  No location stored yet.{'\n'}Click Update to set your location.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={dynamicStyles.updateButton}
              onPress={updateLocation}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color={isDark ? '#000000' : '#FFFFFF'} />
              ) : (
                <>
                  <Ionicons name="refresh" size={24} color={isDark ? '#000000' : '#FFFFFF'} />
                  <Text style={dynamicStyles.updateButtonText}>Update Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={[dynamicStyles.sectionTitle, { marginBottom: 10 }]}>About</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              Your location is used to calculate accurate prayer times. The city name is displayed on the prayer times screen for your reference.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

