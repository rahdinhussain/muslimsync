import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, AppState, Dimensions, Animated } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE, currentPrayerPlace, placeKey, readMethod } from '../utils/prayerPreferences';
import schedule from '../utils/prayerSchedule.cjs';
import { tr, prayerLabel, formatDate, formatPrayerTime } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


const { width } = Dimensions.get('window');

export default function PrayerTimesScreen() {
  const { locale, isRTL } = useAppLocale();

  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const focused = useIsFocused();
  const [revision, setRevision] = useState(0);
  const [settings, setSettings] = useState(null);
  const [chosenDay, setChosenDay] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [windowData, setWindowData] = useState(null);
  const [pending, setPending] = useState(true);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const place = settings?.place;
  const method = settings?.method;
  const key = place ? placeKey(place, method) : null;
  const matching = key && windowData?.key === key ? windowData : null;
  const today = schedule.dayKey(new Date(now), matching?.zone);
  const day = chosenDay || today;
  const tomorrow = schedule.offsetDay(day, 1);
  const selectedDate = new Date(day + 'T12:00:00');
  const entry = matching?.days[day];
  const validDay = entry?.date === day ? entry : null;
  const active = day === today ? schedule.activePrayers(validDay, matching?.days[tomorrow], now) : {};
  const nextPrayer = active.next;
  const cityName = place?.label;
  const refresh = () => setRevision(value => value + 1);
  const openLocation = () => navigation.navigate('Settings', { screen: 'Location' });

  useEffect(() => {
    if (!focused) return;
    let active = true;
    Promise.all([currentPrayerPlace(), readMethod()]).then(([place, method]) => {
      if (active) setSettings({ place, method });
    }).catch(() => { if (active) setSettings({ place: null }); });
    return () => { active = false; };
  }, [focused, revision]);

  useEffect(() => {
    if (!focused) return;
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 15000);
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active') { setNow(Date.now()); refresh(); }
    });
    return () => { clearInterval(tick); listener.remove(); };
  }, [focused]);

  useEffect(() => {
    if (!focused) return;
    const glow = Animated.loop(Animated.sequence([1, 0].map(toValue =>
      Animated.timing(glowAnim, { toValue, duration: 2000, useNativeDriver: false })
    )));
    glow.start();
    return () => glow.stop();
  }, [focused, glowAnim]);

  useEffect(() => {
    if (!focused || !key) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    setPending(true);
    async function load() {
      let cached;
      try { cached = JSON.parse(await AsyncStorage.getItem(CACHE)); } catch {}
      if (!active) return;
      const days = cached?.key === key ? { ...cached.days } : {};
      const publish = offline => {
        if (active) setWindowData({ key, days: { ...days }, zone: days[day]?.zone || days[tomorrow]?.zone || (cached?.key === key ? cached.zone : undefined), offline });
      };
      publish(true);
      const results = await Promise.all([day, tomorrow].map(async date => {
        try {
          const response = await fetch(schedule.urlFor(place, method, date), { signal: controller.signal });
          if (!response.ok) return false;
          days[date] = schedule.parseDay(await response.json(), date, method);
          return true;
        } catch { return false; }
      }));
      if (!active) return;
      for (const storedDate of Object.keys(days)) {
        if (storedDate < schedule.offsetDay(day,-3) || storedDate > schedule.offsetDay(day,4)) delete days[storedDate];
      }
      publish(!results[0]);
      setPending(false);
      if (results.some(Boolean)) await AsyncStorage.setItem(CACHE, JSON.stringify({key, days, zone: days[day]?.zone || days[tomorrow]?.zone})).catch(() => {});
    }
    load().finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [key, day, tomorrow, focused, revision]);

  // Check if a prayer is the current active prayer
  const isCurrentPrayer = (prayerName) => {
    return active.current === prayerName;
  };

  // Get animated border style for current prayer
  const getAnimatedBorderStyle = (prayerName) => {
    if (!isCurrentPrayer(prayerName)) {
      return {};
    }

    const shadowRadius = glowAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [8, 16, 8],
    });

    const opacity = glowAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 1, 0.6],
    });

    return {
      borderWidth: 3, // Constant border width
      borderColor: '#39FF14', // Neon green
      shadowColor: '#39FF14',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacity,
      shadowRadius: shadowRadius,
      elevation: glowAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [8, 16, 8],
      }),
    };
  };

  const prayerNames = {
    Fajr: { name: 'Fajr', icon: 'sunny', color: '#FFA500' },
    Dhuhr: { name: 'Dhuhr', icon: 'sunny', color: '#FFD700' },
    Asr: { name: 'Asr', icon: 'partly-sunny', color: '#FF8C00' },
    Maghrib: { name: 'Maghrib', icon: 'moon', color: '#FF6347' },
    Isha: { name: 'Isha', icon: 'moon', color: '#4B0082' },
  };

  const quickActions = [
    {
      id: 1,
      title: tr("prayerTimes.readQuran"),
      icon: 'book',
      color: colors.text,
      screen: 'Quran',
    },
    {
      id: 2,
      title: tr("navigation.dhikr", { ns: 'common' }),
      icon: 'heart',
      color: colors.text,
      screen: 'Dhikr',
    },
    {
      id: 3,
      title: tr("prayerTimes.qibla"),
      icon: 'compass',
      color: colors.text,
      screen: 'Qibla',
    },
    {
      id: 4,
      title: tr("navigation.duas", { ns: 'common' }),
      icon: 'hand-left',
      color: colors.text,
      screen: 'Dua',
    },
    {
      id: 5,
      title: tr("mosqueFinder.findMosques"),
      icon: 'location',
      color: colors.text,
      screen: 'Mosques',
    },
  ];

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
    dateHeader: {
      backgroundColor: colors.header,
      padding: 20,
      paddingTop: 10,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    arabicDate: {
      fontSize: 20,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'System',
    },
    englishDate: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 15,
    },
    todayButton: {
      backgroundColor: colors.cardSecondary,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 15,
    },
    todayButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    nextPrayerCard: {
      backgroundColor: colors.cardSecondary,
      margin: 20,
      padding: 20,
      borderRadius: 20,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    nextPrayerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    nextPrayerLeft: {
      flex: 1,
      marginEnd: 15,
    },
    nextPrayerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    cardDateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: isRTL ? 'left' : 'right',
      marginBottom: 4,
    },
    cityText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      textAlign: isRTL ? 'left' : 'right',
    },
    cardDateControls: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    cardDateButton: {
      padding: 8,
    },
    nextPrayerLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 5,
    },
    nextPrayerName: {
      color: colors.text,
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    nextPrayerTime: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '600',
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
    refreshButton: {
      flexDirection: 'row',
      backgroundColor: colors.cardSecondary,
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
      marginStart: 10,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    quickActionCard: {
      // 4-column layout with equal-width cards
      width: (width - 40 - 3 * 10) / 4, // 40 padding (20 each side) + 10px gaps
      backgroundColor: colors.card,
      borderRadius: 15,
      paddingVertical: 12,
      paddingHorizontal: 6,
      alignItems: 'center',
      marginBottom: 15,
      borderWidth: 0,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    featureCard: {
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
    featureTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    featureDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  if (!settings) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>{tr("mosqueSchedule.loadingPrayerTimes")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>

      {(
        <View style={dynamicStyles.nextPrayerCard}>
          <View style={dynamicStyles.nextPrayerTopRow}>
            <View style={dynamicStyles.nextPrayerLeft}>
              {nextPrayer ? <>
              <Text style={dynamicStyles.nextPrayerLabel}>{tr("prayers.nextPrayer", { ns: 'common' })}</Text>
              <Text style={dynamicStyles.nextPrayerName}>{prayerLabel(nextPrayer.name)}</Text>
              <Text style={dynamicStyles.nextPrayerTime}>
                {formatPrayerTime(nextPrayer.wall)}
              </Text>
              </> : <Text style={dynamicStyles.nextPrayerLabel}>{tr("mosqueSchedule.prayerSchedule")}</Text>}
            </View>
            <View style={dynamicStyles.nextPrayerRight}>
              <Text style={dynamicStyles.cardDateText}>{formatDate(selectedDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              {cityName && (
                <Text style={dynamicStyles.cityText}>{cityName}</Text>
              )}
              <View style={dynamicStyles.cardDateControls}>
                <TouchableOpacity
                  onPress={() => setChosenDay(schedule.offsetDay(day, -1))}
                  style={dynamicStyles.cardDateButton}
                >
                  <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChosenDay(null)}
                  style={dynamicStyles.todayButton}
                >
                  <Text style={dynamicStyles.todayButtonText}>{tr("prayers.today", { ns: 'common' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChosenDay(schedule.offsetDay(day, 1))}
                  style={dynamicStyles.cardDateButton}
                >
                  <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {(!validDay || matching?.offline || place?.lastKnown) && <View style={dynamicStyles.prayerCard}>
        <Text style={{ color: colors.text, flexShrink: 1 }}>{tr(!place ? 'prayerTimes.chooseArea' : validDay ? 'prayerTimes.savedSchedule' : pending ? 'mosqueSchedule.loadingPrayerTimes' : 'prayerTimes.noVerifiedTimes')}</Text>
      </View>}
      <TouchableOpacity onPress={openLocation} style={dynamicStyles.refreshButton}>
        <Text style={dynamicStyles.refreshButtonText}>{tr('settings.location', { ns: 'common' })}</Text>
      </TouchableOpacity>
      <View style={styles.prayerTimesContainer}>
        {Object.entries(prayerNames).map(([key, prayer]) => (
          <Animated.View 
            key={key} 
            style={[
              dynamicStyles.prayerCard,
              getAnimatedBorderStyle(prayer.name),
            ]}
          >
            <View style={dynamicStyles.prayerIconContainer}>
              <Ionicons name={prayer.icon} size={28} color={prayer.color} />
            </View>
            <View style={styles.prayerInfo}>
              <Text style={dynamicStyles.prayerName}>{prayerLabel(prayer.name)}</Text>
              <Text style={dynamicStyles.prayerTime}>
                {formatPrayerTime(validDay?.prayers[key]?.wall)}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={dynamicStyles.refreshButton}
        onPress={refresh}
      >
        <Ionicons name="refresh" size={20} color={colors.text} />
        <Text style={dynamicStyles.refreshButtonText}>{tr("prayerTimes.refreshTimes")}</Text>
      </TouchableOpacity>

      <View style={styles.quickActionsContainer}>
        <Text style={dynamicStyles.sectionTitle}>{tr("prayerTimes.quickActions")}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.quickActionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
                <Ionicons name={action.icon} size={32} color={action.color} />
              </View>
              <Text style={dynamicStyles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={dynamicStyles.sectionTitle}>{tr("about.features")}</Text>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="moon" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>{tr("about.accuratePrayerTimes")}</Text>
            <Text style={dynamicStyles.featureDescription}>{tr("prayerTimes.getPrecisePrayerTimesBasedOnYourLocation")}</Text>
          </View>
        </View>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="book" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>{tr("prayerTimes.completeQuran")}</Text>
            <Text style={dynamicStyles.featureDescription}>{tr("prayerTimes.readAndListenToTheHolyQuran")}</Text>
          </View>
        </View>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="heart" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>{tr("about.dhikrCounter")}</Text>
            <Text style={dynamicStyles.featureDescription}>{tr("prayerTimes.trackYourDailyRemembranceOfAllah")}</Text>
          </View>
        </View>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="location" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>{tr("about.mosqueFinder")}</Text>
            <Text style={dynamicStyles.featureDescription}>{tr("prayerTimes.discoverMosquesNearYouWithPrayerSchedules")}</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  prayerTimesContainer: {
    padding: 20,
  },
  prayerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuresContainer: {
    padding: 20,
    paddingTop: 0,
  },
  featureContent: {
    marginStart: 15,
    flex: 1,
  },
});

