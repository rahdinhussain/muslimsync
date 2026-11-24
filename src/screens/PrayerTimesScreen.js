import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, AppState, Dimensions } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE, currentPrayerPlace, placeKey, readMethod, readMadhhab } from '../utils/prayerPreferences';
import {OfflineButton} from '../components/OfflineButton';
import {PrayerScheduleTable} from '../components/PrayerScheduleTable';
import {readMonth,savePrayerMonth} from '../utils/offlineContent';
import schedule from '../utils/prayerSchedule.cjs';
import { tr, prayerLabel, formatDate } from '../i18n';
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
  const [savedMonth,setSavedMonth]=useState('');
  const [pending, setPending] = useState(true);
  const place = settings?.place;
  const method = settings?.method;
  const madhhab = settings?.madhhab;
  const key = place ? placeKey(place, method, madhhab) : null;
  const matching = key && windowData?.key === key ? windowData : null;
  const today = schedule.dateAt(now, matching && Object.values(matching.days)[0]);
  const day = chosenDay || today;
  const tomorrow = schedule.offsetDay(day, 1);
  const selectedDate = new Date(day + 'T12:00:00');
  const entry = matching?.days[day];
  const validDay = entry?.date === day ? entry : null;
  const ranges = schedule.windows(validDay, matching?.days[tomorrow]);
  const night = schedule.nightMarkers(validDay, matching?.days[tomorrow]);
  const periods = validDay ? schedule.solarPeriods(validDay) : {};
  const clock = t => schedule.clock(t, validDay, locale, matching?.days[tomorrow]);
  const active = day === today ? schedule.activePrayers(validDay, matching?.days[tomorrow], now, matching?.days[schedule.offsetDay(day,-1)]) : {};
  const nextPrayer = active.next;
  const cityName = place?.label || place?.city;
  const refresh = () => setRevision(value => value + 1);
  const openLocation = () => navigation.navigate('Location');

  useEffect(() => {
    if (!focused) return;
    let active = true;
    Promise.all([currentPrayerPlace(), readMethod(), readMadhhab()]).then(([place, method, madhhab]) => {
      if (active) setSettings({ place, method, madhhab });
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
      const pinned=await readMonth(key,day).catch(()=>null);
      const nextMonth=day.slice(0,7)===tomorrow.slice(0,7)?pinned:await readMonth(key,tomorrow).catch(()=>null);
      if(!active)return;
      setSavedMonth(pinned?key+day.slice(0,7):'');
      if(pinned?.[day])days[day]=pinned[day];
      if(pinned?.[tomorrow])days[tomorrow]=pinned[tomorrow];
      if(nextMonth?.[tomorrow])days[tomorrow]=nextMonth[tomorrow];
      publish(true);
      const results = await Promise.all([day, tomorrow, schedule.offsetDay(day,-1)].map(async date => {
        try {
          const saved = pinned?.[date] || nextMonth?.[date];
          if (saved) days[date] = saved;
          if (days[date]?.date === date) return true;
          days[date] = await schedule.fetchDay(place, method, date, madhhab, controller.signal);
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
    load().catch(() => { if (active) setPending(false); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [key, day, tomorrow, focused, revision]);

  const quickActions = [
    {id:'books',title:tr('library.books'),icon:'library-outline',color:colors.text,screen:'Settings',params:{screen:'Books',initial:false}},
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
    nextPrayerCard: {
      backgroundColor: colors.cardSecondary,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingBottom: 4,
      borderRadius: 20,
    },
    cardTopRow: { flexDirection: 'row', alignItems: 'center' },
    cityButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
    cityText: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
    iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    nextPrayerLabel: { color: colors.textSecondary, fontSize: 12 },
    nextPrayerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    nextPrayerName: { color: colors.text, fontSize: 28, fontWeight: 'bold', flexShrink: 1 },
    nextPrayerTime: { color: colors.text, fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
    cardDateControls: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    cardDateText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', flex: 1 },
    todayButtonText: { color: colors.text, fontSize: 12, fontWeight: '600' },
    status: { color: colors.textSecondary, marginHorizontal: 20, marginBottom: 12, fontSize: 13 },
    calculationLink: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, minHeight: 44 },
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

        <View style={dynamicStyles.nextPrayerCard}>
          <View style={dynamicStyles.cardTopRow}>
            <TouchableOpacity testID="prayer-city" accessibilityRole="button"
              accessibilityLabel={[cityName, tr('settings.location', { ns: 'common' })].filter(Boolean).join(' · ')}
              onPress={openLocation} style={dynamicStyles.cityButton}>
              <Ionicons name="location-outline" size={16} color={colors.text} />
              <Text style={dynamicStyles.cityText} numberOfLines={2}>{cityName || tr('settings.location', { ns: 'common' })}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={tr('prayerTimes.refreshTimes')}
              onPress={refresh} style={dynamicStyles.iconButton}>
              <Ionicons name="refresh-outline" size={18} color={colors.text} />
            </TouchableOpacity>
            {place && <OfflineButton iconOnly saved={savedMonth===key+day.slice(0,7)}
              label={savedMonth===key+day.slice(0,7)?'library.updateMonth':'library.saveMonth'}
              onSave={async()=>{await savePrayerMonth(place,method,key,day,madhhab);refresh();}} />}
          </View>
          <Text style={dynamicStyles.nextPrayerLabel}>{tr(nextPrayer ? 'prayers.nextPrayer' : 'prayers.today', { ns: 'common' })}</Text>
          <View style={dynamicStyles.nextPrayerRow}>
            <Text style={dynamicStyles.nextPrayerName}>{nextPrayer ? prayerLabel(nextPrayer.name) : tr('general.title')}</Text>
            {nextPrayer && <Text style={dynamicStyles.nextPrayerTime}>{clock(nextPrayer.time)}</Text>}
          </View>
          <View style={dynamicStyles.cardDateControls}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={tr('library.previous')}
              onPress={() => setChosenDay(schedule.offsetDay(day, -1))} style={dynamicStyles.iconButton}>
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.cardDateText}>{formatDate(selectedDate, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            {day !== today && <TouchableOpacity accessibilityRole="button" onPress={() => setChosenDay(null)} style={dynamicStyles.iconButton}>
              <Text style={dynamicStyles.todayButtonText}>{tr('prayers.today', { ns: 'common' })}</Text>
            </TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={tr('library.next')}
              onPress={() => setChosenDay(schedule.offsetDay(day, 1))} style={dynamicStyles.iconButton}>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {(!validDay || matching?.offline || place?.lastKnown) && <Text style={dynamicStyles.status}>
          {tr(!place ? 'prayerTimes.chooseArea' : validDay ? 'prayerTimes.savedSchedule' : pending ? 'mosqueSchedule.loadingPrayerTimes' : 'prayerTimes.noVerifiedTimes')}
        </Text>}
        <PrayerScheduleTable ranges={ranges} clock={clock} current={active.current} />
        {validDay && <>
          <Text style={[dynamicStyles.sectionTitle, { fontSize: 16, marginHorizontal: 20, marginTop: 4, marginBottom: 8 }]}>{tr('general.restricted')}</Text>
          <PrayerScheduleTable restricted periods={periods} clock={clock} />
        </>}
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('PrayerTimeCalculation')}
          style={dynamicStyles.calculationLink}>
          <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
          <Text style={[dynamicStyles.featureDescription, { flex: 1 }]}>{tr('general.school')} · {tr('general.'+(madhhab || 'shafii'))}</Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        {validDay && <View style={{ marginHorizontal: 20, marginBottom: 20, gap: 8 }}>
          <Text style={dynamicStyles.featureDescription}>{validDay.zone} · {validDay.method}</Text>
          <Text style={dynamicStyles.featureDescription}>{tr('general.range')}</Text>
          {Object.entries(night).map(([label,time])=><Text key={label} style={dynamicStyles.featureDescription}>{tr('general.'+label)} · {clock(time)}</Text>)}
          {madhhab==='maliki' && <Text style={dynamicStyles.featureDescription}>{tr('general.malikiNote')}</Text>}
          <Text style={dynamicStyles.featureDescription}>{tr('general.guidance')}</Text>
          {validDay.polar && <Text style={dynamicStyles.featureDescription}>{tr('general.polar')}</Text>}
        </View>}
      <View style={styles.quickActionsContainer}>
        <Text style={dynamicStyles.sectionTitle}>{tr("prayerTimes.quickActions")}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.quickActionCard}
              onPress={() => navigation.navigate(action.screen,action.params)}
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

