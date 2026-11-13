import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { tr, prayerLabel, formatDate, formatPrayerTime, formatNumber } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


export default function MosqueScheduleScreen({ route }) {
  const { locale, isRTL } = useAppLocale();

  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { mosque } = route.params || {};
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loadingPrayerTimes, setLoadingPrayerTimes] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    errorText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      backgroundColor: colors.header,
      padding: 30,
      paddingTop: 10,
      alignItems: 'center',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    backButton: {
      position: 'absolute',
      start: 15,
      top: 15,
      padding: 5,
      zIndex: 1,
    },
    mosqueIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    mosqueName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    mosqueAddress: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      backgroundColor: colors.iconBackground,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 15,
      alignItems: 'center',
      marginHorizontal: 5,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    actionButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginStart: 8,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    prayerCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      alignItems: 'center',
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    prayerIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 15,
    },
    prayerName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    prayerTime: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
      contactText: {
        fontSize: 14,
        color: colors.text,
        marginStart: 8,
      },
  });

  if (!mosque) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <Text style={dynamicStyles.errorText}>{tr("mosqueSchedule.noMosqueInformationAvailable")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Prayer name mappings with display order
  const getPrayerDisplayInfo = (key) => {
    const prayerMap = {
      fajr: { name: 'Fajr', icon: 'sunny', color: '#FFA500', order: 1 },
      sunrise: { name: 'Sunrise', icon: 'sunny-outline', color: '#FFD700', order: 1.5 }, // After Fajr
      dhuhr: { name: 'Dhuhr', icon: 'sunny', color: '#FFD700', order: 2 },
      asr: { name: 'Asr', icon: 'partly-sunny', color: '#FF8C00', order: 3 },
      maghrib: { name: 'Maghrib', icon: 'moon', color: '#FF6347', order: 4 },
      isha: { name: 'Isha', icon: 'moon', color: '#4B0082', order: 5 },
    };

    // Handle Jumu'ah prayers (can be jumuah_1, jumuah_2, jumuah_3, etc.)
    if (key.startsWith('jumuah_')) {
      const num = key.replace('jumuah_', '');
      return { 
        name: `Jumu'ah ${num}`, 
        icon: 'people', 
        color: '#4B0082', 
        order: 10 + parseInt(num, 10) // Put Jumu'ah prayers after standard prayers
      };
    }

    return prayerMap[key] || { 
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), 
      icon: 'time-outline', 
      color: colors.text, 
      order: 99 
    };
  };

  useEffect(() => {
    if (mosque?.id) {
      fetchAvailableDates();
    }
  }, [mosque?.id]);

  useEffect(() => {
    // Always fetch prayer times for the selected date (it may not exist in availableDates)
    if (mosque?.id && selectedDate) {
      fetchPrayerTimes();
    }
  }, [selectedDate, mosque?.id]);

  const fetchAvailableDates = async () => {
    if (!mosque?.id) return;

    try {
      // Always set selected date to today first
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDate(today);

      const { data, error } = await supabase
        .from('mosque_prayer_times')
        .select('date')
        .eq('mosque_id', mosque.id)
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) {
        const dates = data.map(row => new Date(row.date));
        setAvailableDates(dates);
      } else {
        setAvailableDates([]);
      }
    } catch (error) {
      setAvailableDates([]);
    }
  };

  const fetchPrayerTimes = async () => {
    if (!mosque?.id) return;

    try {
      setLoadingPrayerTimes(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('mosque_prayer_times')
        .select('times')
        .eq('mosque_id', mosque.id)
        .eq('date', dateString)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No prayer times found for selected date
          setPrayerTimes(null);
        } else {
          setPrayerTimes(null);
        }
      } else {
        // data.times is the JSONB column containing all prayer times
        setPrayerTimes(data.times || null);
      }
    } catch (error) {
      setPrayerTimes(null);
    } finally {
      setLoadingPrayerTimes(false);
    }
  };

  const hasPreviousDate = () => {
    // Always allow going to previous day (no restrictions)
    return true;
  };

  const hasNextDate = () => {
    // Always allow going to next day (no restrictions)
    return true;
  };

  const goToPreviousDate = () => {
    // Navigate to previous calendar day
    const previousDay = subDays(selectedDate, 1);
    setSelectedDate(previousDay);
  };

  const goToNextDate = () => {
    // Navigate to next calendar day
    const nextDay = addDays(selectedDate, 1);
    setSelectedDate(nextDay);
  };

  // Check if today is available
  const isTodayAvailable = () => {
    if (availableDates.length === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return availableDates.some(date => isSameDay(date, today));
  };

  const handleCall = async () => {
    if (!mosque.phone) return;

    try {
      // Clean up the phone number so it's dialable
      let phone = String(mosque.phone).trim();
      // Allow digits and leading +, strip spaces/dashes/brackets etc.
      phone = phone.replace(/(?!^\+)[^\d]/g, '');

      const url = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(tr("mosqueSchedule.unableToPlaceCall"), tr("mosqueSchedule.callingIsNotSupportedOnThisDevice"));
      }
    } catch (error) {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("mosqueSchedule.unableToOpenThePhoneDialer"));
    }
  };

  const handleOpenWebsite = () => {
    if (!mosque.website) return;
    let url = mosque.website.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("mosqueSchedule.unableToOpenWebsite"));
    });
  };

  const handleDirections = () => {
    const parts = [];
    if (mosque.address) parts.push(mosque.address);
    if (mosque.city) parts.push(mosque.city);
    if (mosque.state) parts.push(mosque.state);
    const query = encodeURIComponent(parts.join(', '));

    const openAppleMaps = () => {
      const url = `http://maps.apple.com/?q=${query}`;
      Linking.openURL(url).catch(() => {
        // Fallback to web Google Maps
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(tr("status.error", { ns: 'common' }), tr("mosqueSchedule.unableToOpenMaps"));
        });
      });
    };

    const openGoogleMaps = () => {
      const iosUrl = `comgooglemaps://?q=${query}`;
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

      if (Platform.OS === 'ios') {
        Linking.openURL(iosUrl).catch(() => {
          Linking.openURL(webUrl).catch(() => {
            Alert.alert(tr("status.error", { ns: 'common' }), tr("mosqueSchedule.unableToOpenGoogleMaps"));
          });
        });
      } else {
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(tr("status.error", { ns: 'common' }), tr("mosqueSchedule.unableToOpenGoogleMaps"));
        });
      }
    };

    if (Platform.OS === 'ios') {
      Alert.alert(
        tr("mosqueSchedule.openDirections"),
        tr("mosqueSchedule.chooseMapsApp"),
        [
          { text: tr("mosqueSchedule.appleMaps"), onPress: openAppleMaps },
          { text: tr("mosqueSchedule.googleMaps"), onPress: openGoogleMaps },
          { text: tr("actions.cancel", { ns: 'common' }), style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        tr("mosqueSchedule.openDirections"),
        tr("mosqueSchedule.chooseMapsApp"),
        [
          { text: tr("mosqueSchedule.googleMaps"), onPress: openGoogleMaps },
          { text: tr("actions.cancel", { ns: 'common' }), style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const fullAddress = [
    mosque.address,
    mosque.city,
    mosque.state,
    mosque.zip,
    mosque.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={dynamicStyles.backButton}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.mosqueName}>{mosque.name}</Text>
        <Text style={dynamicStyles.mosqueAddress}>{fullAddress}</Text>
      </View>

      <View style={styles.actionsContainer}>
        {mosque.phone && (
          <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={dynamicStyles.actionButton}
          onPress={handleDirections}
        >
          <Ionicons name="navigate" size={24} color={colors.text} />
        </TouchableOpacity>
        {mosque.website && (
          <TouchableOpacity
            style={dynamicStyles.actionButton}
            onPress={handleOpenWebsite}
          >
            <Ionicons name="globe-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleHeader}>
        <Text style={dynamicStyles.sectionTitle}>{tr("mosqueSchedule.prayerSchedule")}</Text>
          {selectedDate && (
            <View style={styles.dateNavigation}>
              <TouchableOpacity
                onPress={goToPreviousDate}
                disabled={!hasPreviousDate()}
                style={[
                  styles.dateNavButton,
                  { backgroundColor: colors.cardSecondary },
                  !hasPreviousDate() && styles.dateNavButtonDisabled
                ]}
              >
                <Ionicons 
                  name={isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={20} 
                  color={hasPreviousDate() ? colors.text : colors.textSecondary} 
                />
              </TouchableOpacity>
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDate(selectedDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={goToNextDate}
                disabled={!hasNextDate()}
                style={[
                  styles.dateNavButton,
                  { backgroundColor: colors.cardSecondary },
                  !hasNextDate() && styles.dateNavButtonDisabled
                ]}
              >
                <Ionicons 
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={20} 
                  color={hasNextDate() ? colors.text : colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loadingPrayerTimes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{tr("mosqueSchedule.loadingPrayerTimes")}</Text>
          </View>
        ) : !prayerTimes ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDateNormalized = new Date(selectedDate);
                selectedDateNormalized.setHours(0, 0, 0, 0);
                if (isSameDay(selectedDateNormalized, today)) {
                  return tr('mosqueSchedule.unavailableToday');
                }
                return tr('mosqueSchedule.unavailableDate', { date: formatDate(selectedDate, { year: 'numeric', month: 'long', day: 'numeric' }) });
              })()}
            </Text>
          </View>
        ) : (
          <>
            {/* Build prayer cards array */}
            {(() => {
              const prayerCards = [];

              // Handle standard prayers (fajr, dhuhr, asr, maghrib, isha) - objects with athan/iqama (lowercase)
              ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((key) => {
                if (prayerTimes[key] && typeof prayerTimes[key] === 'object' && !Array.isArray(prayerTimes[key])) {
                  const value = prayerTimes[key];
                  // Check for lowercase keys (athan/iqama) or uppercase (AThan/Iqama) for compatibility
                  // Preserve exact format from database (24-hour like "14:30" or 12-hour like "2:30 PM")
                  const athan = (value.athan || value.AThan) ? String(value.athan || value.AThan).trim() : '';
                  const iqama = (value.iqama || value.Iqama) ? String(value.iqama || value.Iqama).trim() : '';
                  if (athan || iqama) {
                    const prayerInfo = getPrayerDisplayInfo(key);
                    prayerCards.push({ 
                      key, 
                      athan, 
                      iqama, 
                      hasBoth: !!(athan && iqama),
                      ...prayerInfo 
                    });
                  }
                }
              });

              // Handle sunrise - single string value (after Fajr)
              // Preserve exact format from database (24-hour like "06:30" or 12-hour like "6:30 AM")
              if (prayerTimes.sunrise && (typeof prayerTimes.sunrise === 'string' || typeof prayerTimes.sunrise === 'number')) {
                const sunriseValue = String(prayerTimes.sunrise).trim();
                if (sunriseValue !== '') {
                  const prayerInfo = getPrayerDisplayInfo('sunrise');
                  prayerCards.push({ key: 'sunrise', displayTime: sunriseValue, ...prayerInfo });
                }
              }

              // Handle jummah (note: key is "jummah" not "jumuah") - array of objects, create a card for each
              const jummahKey = prayerTimes.jummah ? 'jummah' : (prayerTimes.jumuah ? 'jumuah' : null);
              if (jummahKey && Array.isArray(prayerTimes[jummahKey])) {
                const jummahArray = prayerTimes[jummahKey];
                jummahArray.forEach((jummahItem, index) => {
                  if (jummahItem && typeof jummahItem === 'object') {
                    // Check for lowercase keys (athan/iqama) or uppercase (AThan/Iqama) for compatibility
                    // Preserve exact format from database (24-hour like "14:30" or 12-hour like "2:30 PM")
                    const athan = (jummahItem.athan || jummahItem.AThan) ? String(jummahItem.athan || jummahItem.AThan).trim() : '';
                    const iqama = (jummahItem.iqama || jummahItem.Iqama) ? String(jummahItem.iqama || jummahItem.Iqama).trim() : '';
                    if (athan || iqama) {
                      // Only show number if there's more than one Jumu'ah
                      const name = jummahArray.length > 1 ? tr('mosqueSchedule.fridayPrayerNumber', { number: formatNumber(index + 1) }) : tr('prayers.jumuah', { ns: 'common' });
                      prayerCards.push({
                        key: `jumuah_${index}`,
                        athan,
                        iqama,
                        hasBoth: !!(athan && iqama),
                        name,
                        icon: 'people',
                        color: '#4B0082',
                        order: 10 + index,
                      });
                    }
                  }
                });
              }

              // Sort by order and render
              return prayerCards
                .sort((a, b) => a.order - b.order)
                .map(({ key, displayTime, athan, iqama, hasBoth, name, icon, color }) => (
          <View key={key} style={dynamicStyles.prayerCard}>
            <View style={dynamicStyles.prayerIconContainer}>
                      <Ionicons name={icon} size={28} color={color} />
            </View>
            <View style={styles.prayerInfo}>
                      <Text style={dynamicStyles.prayerName}>{key.startsWith('jumuah_') ? name : prayerLabel(key)}</Text>
                      {hasBoth ? (
                        <View style={styles.prayerTimeContainer}>
                          <View style={styles.timeRow}>
                            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{tr("mosqueSchedule.athan")}</Text>
                            <Text style={dynamicStyles.prayerTime}>{formatPrayerTime(athan)}</Text>
                          </View>
                          <View style={styles.timeRow}>
                            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{tr("mosqueSchedule.iqama")}</Text>
                            <Text style={dynamicStyles.prayerTime}>{formatPrayerTime(iqama)}</Text>
                          </View>
                        </View>
                      ) : (
              <Text style={dynamicStyles.prayerTime}>
                          {formatPrayerTime(displayTime || athan || iqama)}
                        </Text>
                      )}
                    </View>
                  </View>
                ));
            })()}
          </>
        )}
      </View>

      {/* Notice Section */}
      {mosque.notice && String(mosque.notice).trim() !== '' && (
        <View style={styles.noticeContainer}>
          <View style={[dynamicStyles.infoCard, { backgroundColor: colors.cardSecondary || colors.card }]}>
            <Ionicons name="megaphone-outline" size={24} color={colors.text} />
            <View style={styles.infoContent}>
              <Text style={dynamicStyles.infoTitle}>{tr("mosqueSchedule.notice")}</Text>
              <Text style={dynamicStyles.infoText}>
                {String(mosque.notice).trim()}
              </Text>
            </View>
          </View>
      </View>
      )}

      <View style={styles.infoContainer}>
        <View style={dynamicStyles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.text} />
          <View style={styles.infoContent}>
            <Text style={dynamicStyles.infoTitle}>{tr("mosqueSchedule.aboutThisMosque")}</Text>
            <Text style={dynamicStyles.infoText}>{tr("mosqueSchedule.visitThisMosqueForCongregationalPrayersAndCommunity")}</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  scheduleContainer: {
    padding: 20,
  },
  scheduleHeader: {
    marginBottom: 15,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 15,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavButtonDisabled: {
    opacity: 0.5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 200,
    textAlign: 'center',
  },
  prayerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  noticeContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoContent: {
    flex: 1,
    marginStart: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  prayerTimeContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    marginEnd: 8,
    fontWeight: '500',
  },
});

