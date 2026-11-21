import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { LocalizedTextInput as TextInput } from '../components/LocalizedPrimitives';
import { readPlace, savePlace, locatePrayerPlace } from '../utils/prayerPreferences';
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

  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  useEffect(() => {
    let active = true;
    readPlace().then(place => {
      if (!active || !place) return;
      setCurrentCity(place.label);
      setCurrentLocation(place.mode === 'gps' ? place : null);
      setCity(place.city || ''); setCountry(place.country || '');
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const updateLocation = async (manual = false) => {
    if (manual && (!city.trim() || !country.trim())) return;
    setUpdating(true);
    try {
      const place = manual ? { mode: 'city', city: city.trim(), country: country.trim(), label: [city.trim(), country.trim()].join(', ') } : await locatePrayerPlace();
      await savePlace(place);
      setCurrentCity(place.label);
      setCurrentLocation(manual ? null : place);
      Alert.alert(tr('dua.success'), tr('locationSettings.locationUpdatedSuccessfully'));
    } catch {
      Alert.alert(tr('status.error', { ns: 'common' }), tr('locationSettings.failedToUpdateLocationPleaseTryAgain'));
    } finally { setUpdating(false); }
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
                        {currentLocation.latitude.toFixed(2)}
                      </Text>
                    </View>
                    <View style={dynamicStyles.infoRow}>
                      <Text style={dynamicStyles.infoLabel}>{tr("locationSettings.longitude")}</Text>
                      <Text style={dynamicStyles.infoValue}>
                        {currentLocation.longitude.toFixed(2)}
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

            <Text style={{ color: colors.textSecondary }}>{tr('prayerTimes.areaDisclosure')}</Text>
            <TextInput style={dynamicStyles.infoValue} placeholderTextColor={colors.textSecondary} placeholder={tr('locationSettings.city')} maxLength={100} value={city} onChangeText={setCity} />
            <TextInput style={dynamicStyles.infoValue} placeholderTextColor={colors.textSecondary} placeholder={tr('prayerTimes.country')} maxLength={100} value={country} onChangeText={setCountry} />
            <TouchableOpacity style={dynamicStyles.updateButton} onPress={() => updateLocation(true)} disabled={updating || !city.trim() || !country.trim()}>
              <Text style={dynamicStyles.updateButtonText}>{tr('prayerTimes.useCity')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.updateButton}
              onPress={() => updateLocation()}
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

