import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, AppState } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import { useTheme } from '../hooks/useTheme';
import { getCachedLocation, hasValidCachedLocation } from '../utils/locationCache';
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
  const [location, setLocation] = useState(null);
  const [qiblaBearing, setQiblaBearing] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  
  // Animation values - using Animated.Value for native driver performance
  const compassRotation = useState(new Animated.Value(0))[0];
  const qiblaArrowRotation = useState(new Animated.Value(0))[0];
  
  // Refs for tracking - using refs to avoid re-renders
  const smoothedHeadingRef = useRef(0);
  const magDataRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isActiveRef = useRef(true);
  
  // Light smoothing: 0.3 = 30% new data, 70% previous (just enough to reduce jitter)
  const SMOOTHING_ALPHA = 0.3;

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

  // Load location when screen opens
  useEffect(() => {
    loadLocation();
  }, []);

  // Check if location needs refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && location) {
        // App came to foreground - check if location is stale
        (async () => {
          const isValid = await hasValidCachedLocation();
          if (!isValid) {
            // Location is stale, refresh it
            loadLocation(true);
          }
        })();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [location]);

  // Manual refresh function
  const handleRefreshLocation = () => {
    loadLocation(true);
  };

  // High-frequency sensor reading and smooth 60fps rendering
  useEffect(() => {
    // Magnetometer subscription - reads at high frequency
    const subscription = Magnetometer.addListener((data) => {
      magDataRef.current = data;
    });

    // Set sensor to update as fast as possible (16ms = ~60Hz)
    Magnetometer.setUpdateInterval(16);

    // Smooth 60fps rendering loop using requestAnimationFrame
    const renderLoop = () => {
      if (!isActiveRef.current) return;

      if (magDataRef.current) {
        const { x, y } = magDataRef.current;
        
        // Calculate heading from magnetometer
        // For portrait mode: atan2(-x, y) gives heading from North
        let rawHeading = Math.atan2(-x, y) * (180 / Math.PI);
        rawHeading = (rawHeading + 360) % 360;
        
        // Apply light low-pass filter for minimal smoothing
        // Handle 360-degree wrap-around
        let diff = rawHeading - smoothedHeadingRef.current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        // Smooth: new = old + (difference * smoothing_factor)
        smoothedHeadingRef.current = smoothedHeadingRef.current + diff * SMOOTHING_ALPHA;
        smoothedHeadingRef.current = (smoothedHeadingRef.current + 360) % 360;
        
        // Calculate compass rotation: rotate compass opposite to heading so N always points north
        const targetCompassRotation = -smoothedHeadingRef.current;
        
        // Update compass rotation DIRECTLY (no animation delay for instant response)
        compassRotation.setValue(targetCompassRotation);
      }

      // Continue animation loop at 60fps
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    // Start the render loop
    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isActiveRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      subscription && subscription.remove();
    };
  }, [compassRotation]);

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
