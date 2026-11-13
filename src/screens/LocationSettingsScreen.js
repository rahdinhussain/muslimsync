import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedLocation, clearLocationCache } from '../utils/locationCache';
import { tr } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


export default function LocationSettingsScreen() {
  const { locale, isRTL } = useAppLocale();

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
        Alert.alert(tr("status.error", { ns: 'common' }), tr("locationSettings.failedToGetLocationPleaseTryAgain"));
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
          
          Alert.alert(tr("dua.success"), tr("locationSettings.locationUpdatedSuccessfully"));
        } else {
          Alert.alert(tr("status.error", { ns: 'common' }), tr("locationSettings.couldNotDetermineCityNameFromLocation"));
        }
      } catch (geocodeError) {
        if (geocodeError.message && geocodeError.message.includes('rate limit')) {
          Alert.alert(tr("locationSettings.rateLimit"), tr("locationSettings.tooManyRequestsPleaseTryAgainInA"));
        } else {
          Alert.alert(tr("status.error", { ns: 'common' }), tr("locationSettings.failedToGetCityNamePleaseTryAgain"));
        }
      }
    } catch (error) {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("locationSettings.failedToUpdateLocationPleaseTryAgain"));
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
      marginEnd: 10,
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
      marginEnd: 10,
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
      marginStart: 10,
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
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>{tr("settings.location", { ns: 'common' })}</Text>
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
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{tr("settings.location", { ns: 'common' })}</Text>
        </View>

        <ScrollView style={dynamicStyles.content}>
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>{tr("locationSettings.currentLocation")}</Text>
            
            {currentCity || currentLocation ? (
              <>
                {currentCity && (
                  <View style={dynamicStyles.infoRow}>
                    <Text style={dynamicStyles.infoLabel}>{tr("locationSettings.city")}</Text>
                    <Text style={dynamicStyles.infoValue}>{currentCity}</Text>
                  </View>
                )}
                {currentLocation && (
                  <>
                    <View style={dynamicStyles.infoRow}>
                      <Text style={dynamicStyles.infoLabel}>{tr("locationSettings.latitude")}</Text>
                      <Text style={dynamicStyles.infoValue}>
                        {currentLocation.latitude.toFixed(6)}
                      </Text>
                    </View>
                    <View style={dynamicStyles.infoRow}>
                      <Text style={dynamicStyles.infoLabel}>{tr("locationSettings.longitude")}</Text>
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
                <Text style={dynamicStyles.emptyStateText}>{tr("locationSettings.noLocationStoredYetClickUpdateToSet")}</Text>
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
                  <Text style={dynamicStyles.updateButtonText}>{tr("locationSettings.updateLocation")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={[dynamicStyles.sectionTitle, { marginBottom: 10 }]}>{tr("navigation.about", { ns: 'common' })}</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{tr("locationSettings.yourLocationIsUsedToCalculateAccuratePrayer")}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

