import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, AppState } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Magnetometer } from 'expo-sensors';
import { useTheme } from '../hooks/useTheme';
import { getCachedLocation } from '../utils/locationCache';
import { tr } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

// Utility functions
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Calculate bearing from current location to Kaaba using Haversine formula
 * Returns bearing in degrees (0-360, where 0 = North)
 */
function calculateQiblaBearing(lat, lon) {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LON - lon);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = toDeg(Math.atan2(y, x)); // -180..180
  return (θ + 360) % 360; // 0..360
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function QiblaScreen() {
  const { locale, isRTL } = useAppLocale();

  const { colors } = useTheme();
  const focused = useIsFocused();
  const [foreground,setForeground] = useState(AppState.currentState !== "background");
  const [location, setLocation] = useState(null);
  const [qiblaBearing, setQiblaBearing] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  
  // Animation values - using Animated.Value for native driver performance
  const compassRotation = useState(new Animated.Value(0))[0];
  const qiblaArrowRotation = useState(new Animated.Value(0))[0];
  
  // Refs for tracking - using refs to avoid re-renders
  
  // Light smoothing: 0.3 = 30% new data, 70% previous (just enough to reduce jitter)

  // Load location from cache or fetch new one
  const loadLocation = async (forceRefresh = false) => {
    try {
      setIsRefreshingLocation(true);
      const loc = await getCachedLocation(forceRefresh);
      
      if (loc) {
        setLocation(loc);
        
        // Calculate Qibla bearing
        const bearing = calculateQiblaBearing(loc.latitude, loc.longitude);
        setQiblaBearing(bearing);
        qiblaArrowRotation.setValue(bearing);
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg('errors.getLocation');
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (focused && foreground) loadLocation();
  }, [focused, foreground]);

  // Manual refresh function
  const handleRefreshLocation = () => {
    loadLocation(true);
  };

  useEffect(() => {
    if (!focused || !foreground) return;
    let heading = null;
    Magnetometer.setUpdateInterval(50);
    const sub = Magnetometer.addListener(({x,y}) => {
      const target = (Math.atan2(-x,y)*180/Math.PI+360)%360;
      const delta = heading === null ? 0 : ((target-heading+540)%360)-180;
      heading = heading === null ? target : (heading+delta*0.35+360)%360;
      compassRotation.setValue(-heading);
    });
    return () => sub.remove();
  }, [focused, foreground, compassRotation]);

  // Set Qibla arrow rotation (only when bearing changes, not on every frame)
  useEffect(() => {
    if (qiblaBearing == null) return;
    qiblaArrowRotation.setValue(qiblaBearing);
  }, [qiblaBearing, qiblaArrowRotation]);

  const compassRotationInterpolate = compassRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const qiblaArrowRotationInterpolate = qiblaArrowRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{tr("qibla.qiblaDirection")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{tr("qibla.holdYourPhoneFlatAndRotateUntilThe")}</Text>
        </View>

        {/* Refresh Location Button */}
        {location && (
          <TouchableOpacity
            onPress={handleRefreshLocation}
            disabled={isRefreshingLocation}
            style={[styles.refreshButton, { backgroundColor: colors.card }]}
          >
            <Ionicons 
              name={isRefreshingLocation ? 'refresh' : 'refresh-outline'} 
              size={18} 
              color={colors.text} 
            />
            <Text style={[styles.refreshButtonText, { color: colors.text }]}>
              {isRefreshingLocation ? tr("qibla.updatingLocation") : tr("qibla.refreshLocation")}
            </Text>
          </TouchableOpacity>
        )}

        {errorMsg ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{tr(errorMsg)}</Text>
          </View>
        ) : !location || qiblaBearing == null ? (
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>{tr("qibla.calculatingQiblaDirection")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.compassContainer}>
              <Animated.View
                style={[
                  styles.compassCircle,
                  { 
                    borderColor: colors.textSecondary,
                    transform: [{ rotate: compassRotationInterpolate }],
                  },
                ]}
              >
                {/* North Label */}
                <Text style={[styles.compassLabel, styles.northLabel, { color: colors.text }]}>{tr("qibla.n")}</Text>
                {/* South Label */}
                <Text style={[styles.compassLabel, styles.southLabel, { color: colors.textSecondary }]}>{tr("qibla.s")}</Text>
                {/* East Label */}
                <Text style={[styles.compassLabel, styles.eastLabel, { color: colors.textSecondary }]}>{tr("qibla.e")}</Text>
                {/* West Label */}
                <Text style={[styles.compassLabel, styles.westLabel, { color: colors.textSecondary }]}>{tr("qibla.w")}</Text>
                
                {/* Qibla Arrow - rotates relative to compass */}
                <Animated.View
                  style={[
                    styles.arrowContainer,
                    { transform: [{ rotate: qiblaArrowRotationInterpolate }] },
                  ]}
                >
                  <View style={styles.arrowShape}>
                    <Ionicons name="arrow-up" size={40} color={colors.primary || '#007AFF'} />
                  </View>
                  <Text style={[styles.arrowText, { color: colors.primary || '#007AFF' }]}>{tr("prayerTimes.qibla")}</Text>
                </Animated.View>
              </Animated.View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{tr("qibla.forBestAccuracyHoldThePhoneFlatScreen")}</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{tr("qibla.keepItAwayFromMetalObjectsOrMagnets")}</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{tr("qibla.slowlyRotateYourselfUntilTheQiblaArrowPoints")}</Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  compassContainer: {
    direction: 'ltr',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCircle: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassLabel: {
    position: 'absolute',
    fontWeight: '700',
    fontSize: 20,
  },
  northLabel: {
    top: 15,
  },
  southLabel: {
    bottom: 15,
  },
  eastLabel: {
    right: 15,
  },
  westLabel: {
    left: 15,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowShape: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
