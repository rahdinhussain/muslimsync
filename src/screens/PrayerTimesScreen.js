import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { format, addDays } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PrayerTimesScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prayerMethod, setPrayerMethod] = useState(2); // Default: ISNA (method 2)
  const [cityName, setCityName] = useState(null);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getLocation();
    loadPrayerMethod();
  }, []);

  // Animate the glow effect continuously
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, [glowAnim]);

  const loadPrayerMethod = async () => {
    try {
      const saved = await AsyncStorage.getItem('@prayer_calculation_method');
      if (saved !== null) {
        setPrayerMethod(parseInt(saved, 10));
      }
    } catch (error) {
      console.log('Error loading prayer method:', error);
    }
  };

  useEffect(() => {
    if (location) {
      fetchPrayerTimes();
      fetchHijriDate();
    }
  }, [location, selectedDate, prayerMethod]);

  const fetchHijriDate = async () => {
    try {
      // Try Aladhan API first (more reliable structure)
      const date = format(selectedDate, 'dd-MM-yyyy');
      const hijriUrl = `https://api.aladhan.com/v1/gToH/${date}`;
      const hijriResponse = await fetch(hijriUrl);
      const hijriData = await hijriResponse.json();
      
      if (hijriData.code === 200 && hijriData.data && hijriData.data.hijri) {
        // Aladhan API structure: data.hijri.date (day), data.hijri.month.number, data.hijri.year
        setHijriDate(hijriData.data.hijri);
      }
    } catch (error) {
      // Fallback to UmmahAPI
      try {
        const date = format(selectedDate, 'yyyy-MM-dd');
        const hijriUrl = `https://ummahapi.com/api/hijri-date?date=${date}`;
        const hijriResponse = await fetch(hijriUrl);
        const hijriData = await hijriResponse.json();
        
        if (hijriData && hijriData.hijri) {
          setHijriDate(hijriData.hijri);
        } else if (hijriData && hijriData.data) {
          setHijriDate(hijriData.data);
        }
      } catch (error2) {
        // Will use fallback conversion
      }
    }
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for accurate prayer times.');
        setLoading(false);
        return;
      }

      let locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData.coords);
      
      // Get city name from coordinates
      getCityName(locationData.coords.latitude, locationData.coords.longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Using default location.');
      setLocation({ latitude: 40.7128, longitude: -74.0060 }); // Default to NYC
      getCityName(40.7128, -74.0060);
    }
  };

  const getCityName = async (latitude, longitude) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        // Try to get city, if not available use subAdministrativeArea or administrativeArea
        const city = address.city || address.subAdministrativeArea || address.administrativeArea || 'Unknown';
        setCityName(city);
      }
    } catch (error) {
      console.log('Error getting city name:', error);
      setCityName(null);
    }
  };

  const fetchPrayerTimes = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const date = format(selectedDate, 'yyyy-MM-dd');
      const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${location.latitude}&longitude=${location.longitude}&method=${prayerMethod}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 200) {
        setPrayerTimes(data.data.timings);
      } else {
        throw new Error('Failed to fetch prayer times');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch prayer times. Please try again.');
      // Set default times for demo
      setPrayerTimes({
        Fajr: '05:30',
        Dhuhr: '12:15',
        Asr: '15:45',
        Maghrib: '18:20',
        Isha: '19:45',
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha },
    ];

    for (let prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date(selectedDate);
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime > now) {
        return { ...prayer, time: prayerTime };
      }
    }

    // If all prayers passed, return first prayer of next day
    return { name: 'Fajr', time: addDays(selectedDate, 1) };
  };

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha },
    ];

    // Find the last prayer that has already passed
    let currentPrayer = null;
    for (let i = prayers.length - 1; i >= 0; i--) {
      const prayer = prayers[i];
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date(selectedDate);
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime <= now) {
        currentPrayer = { ...prayer, time: prayerTime };
        break;
      }
    }

    // If no prayer has passed today, return the last prayer from previous day
    // (This handles the case between Isha and Fajr)
    if (!currentPrayer) {
      return { name: 'Isha', time: prayers[prayers.length - 1].time };
    }

    return currentPrayer;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString;
  };

  const formatArabicDate = (date) => {
    const arabicDays = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    
    // Islamic calendar months in English transliteration
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani', 
      'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 
      'Sha\'ban', 'Ramadan', 'Shawwal', 
      'Dhul Qa\'dah', 'Dhul Hijjah'
    ];
    
    // Use Hijri date from API if available
    if (hijriDate) {
      const day = arabicDays[date.getDay()];
      
      // Aladhan API structure:
      // hijriDate.day is the day as string (e.g., "16")
      // hijriDate.month.number is the month number (1-12)
      // hijriDate.month.en is the month name (but has special characters)
      // hijriDate.year is the year as string (e.g., "1446")
      
      let dayNum, monthName, year;
      
      // Extract day - use 'day' field, not 'date' (date is the full date string)
      if (hijriDate.day !== undefined) {
        dayNum = typeof hijriDate.day === 'string' ? parseInt(hijriDate.day) : hijriDate.day;
      } else if (hijriDate.date !== undefined) {
        // If only date string is available, parse it (format: "DD-MM-YYYY")
        const dateParts = hijriDate.date.split('-');
        if (dateParts.length >= 1) {
          dayNum = parseInt(dateParts[0]);
        }
      }
      
      // Extract month - use month.number to get correct month from our array
      if (hijriDate.month?.number !== undefined) {
        const monthNum = typeof hijriDate.month.number === 'string' 
          ? parseInt(hijriDate.month.number) 
          : hijriDate.month.number;
        // month.number is 1-indexed (1-12), array is 0-indexed
        monthName = hijriMonths[monthNum - 1];
      } else if (hijriDate.month?.en) {
        // Fallback to API month name if number not available
        monthName = hijriDate.month.en;
      }
      
      // Extract year
      year = hijriDate.year;
      if (typeof year === 'string') {
        year = parseInt(year);
      }
      
      if (dayNum && monthName && year) {
        return `${day}, ${dayNum} ${monthName} ${year}`;
      }
    }
    
    // Fallback: Use accurate conversion algorithm
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
    const gregorianDay = date.getDate();
    
    // Accurate Gregorian to Hijri conversion
    const jd = Math.floor((1461 * (gregorianYear + 4800 + Math.floor((gregorianMonth - 14) / 12))) / 4) +
               Math.floor((367 * (gregorianMonth - 2 - 12 * Math.floor((gregorianMonth - 14) / 12))) / 12) -
               Math.floor((3 * Math.floor((gregorianYear + 4900 + Math.floor((gregorianMonth - 14) / 12)) / 100)) / 4) +
               gregorianDay - 32075;
    
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const hijriMonth = Math.floor((24 * l3) / 709);
    const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
    const hijriYear = 30 * n + j - 30;
    
    const day = arabicDays[date.getDay()];
    const monthName = hijriMonths[hijriMonth - 1];
    
    return `${day}, ${hijriDay} ${monthName} ${hijriYear}`;
  };

  const nextPrayer = getNextPrayer();
  const currentPrayer = getCurrentPrayer();

  // Check if a prayer is the current active prayer
  const isCurrentPrayer = (prayerName) => {
    return currentPrayer && currentPrayer.name === prayerName;
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
      title: 'Read Quran',
      icon: 'book',
      color: colors.text,
      screen: 'Quran',
    },
    {
      id: 2,
      title: 'Dhikr',
      icon: 'heart',
      color: colors.text,
      screen: 'Dhikr',
    },
    {
      id: 3,
      title: 'Qibla',
      icon: 'compass',
      color: colors.text,
      screen: 'Qibla',
    },
    {
      id: 4,
      title: 'Duas',
      icon: 'hand-left',
      color: colors.text,
      screen: 'Dua',
    },
    {
      id: 5,
      title: 'Find Mosques',
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
      marginRight: 15,
    },
    nextPrayerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    cardDateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'right',
      marginBottom: 4,
    },
    cityText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      textAlign: 'right',
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
      marginRight: 15,
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
      marginLeft: 10,
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

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading prayer times...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>

      {nextPrayer && (
        <View style={dynamicStyles.nextPrayerCard}>
          <View style={dynamicStyles.nextPrayerTopRow}>
            <View style={dynamicStyles.nextPrayerLeft}>
              <Text style={dynamicStyles.nextPrayerLabel}>Next Prayer</Text>
              <Text style={dynamicStyles.nextPrayerName}>{nextPrayer.name}</Text>
              <Text style={dynamicStyles.nextPrayerTime}>
                {format(nextPrayer.time, 'h:mm a')}
              </Text>
            </View>
            <View style={dynamicStyles.nextPrayerRight}>
              <Text style={dynamicStyles.cardDateText}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
              {cityName && (
                <Text style={dynamicStyles.cityText}>{cityName}</Text>
              )}
              <View style={dynamicStyles.cardDateControls}>
                <TouchableOpacity
                  onPress={() => setSelectedDate(addDays(selectedDate, -1))}
                  style={dynamicStyles.cardDateButton}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedDate(new Date())}
                  style={dynamicStyles.todayButton}
                >
                  <Text style={dynamicStyles.todayButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedDate(addDays(selectedDate, 1))}
                  style={dynamicStyles.cardDateButton}
                >
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

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
              <Text style={dynamicStyles.prayerName}>{prayer.name}</Text>
              <Text style={dynamicStyles.prayerTime}>
                {formatTime(prayerTimes?.[key])}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={dynamicStyles.refreshButton}
        onPress={fetchPrayerTimes}
      >
        <Ionicons name="refresh" size={20} color={colors.text} />
        <Text style={dynamicStyles.refreshButtonText}>Refresh Times</Text>
      </TouchableOpacity>

      <View style={styles.quickActionsContainer}>
        <Text style={dynamicStyles.sectionTitle}>Quick Actions</Text>
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
        <Text style={dynamicStyles.sectionTitle}>Features</Text>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="moon" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>Accurate Prayer Times</Text>
            <Text style={dynamicStyles.featureDescription}>
              Get precise prayer times based on your location
            </Text>
          </View>
        </View>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="book" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>Complete Quran</Text>
            <Text style={dynamicStyles.featureDescription}>
              Read and listen to the Holy Quran
            </Text>
          </View>
        </View>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="heart" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>Dhikr Counter</Text>
            <Text style={dynamicStyles.featureDescription}>
              Track your daily remembrance of Allah
            </Text>
          </View>
        </View>
        <View style={dynamicStyles.featureCard}>
          <Ionicons name="location" size={24} color={colors.text} />
          <View style={styles.featureContent}>
            <Text style={dynamicStyles.featureTitle}>Mosque Finder</Text>
            <Text style={dynamicStyles.featureDescription}>
              Discover mosques near you with prayer schedules
            </Text>
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
    marginLeft: 15,
    flex: 1,
  },
});

