import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useTheme } from '../hooks/useTheme';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

// Bearing from current location to the Kaaba (0–360 degrees, where 0 = North)
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

export default function QiblaScreen() {
  const { colors } = useTheme();
  const [location, setLocation] = useState(null);
  const [qiblaBearing, setQiblaBearing] = useState(null);
  const [heading, setHeading] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const rotation = useState(new Animated.Value(0))[0];

  // Get user location and compute Qibla bearing
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission is required to calculate Qibla.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        setLocation({ latitude, longitude });
        setQiblaBearing(calculateQiblaBearing(latitude, longitude));
      } catch (err) {
        setErrorMsg('Unable to get your location. Please try again.');
      }
    })();
  }, []);

  // Listen to magnetometer for device heading
  useEffect(() => {
    const subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      // Heading (0–360) from North
      const angle = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
      setHeading(angle);
    });

    Magnetometer.setUpdateInterval(400);

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  // Animate pointer to always point towards Qibla relative to phone
  useEffect(() => {
    if (qiblaBearing == null) return;

    const relativeDirection = (qiblaBearing - heading + 360) % 360;

    Animated.timing(rotation, {
      toValue: relativeDirection,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [qiblaBearing, heading, rotation]);

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Qibla Direction</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Hold your phone flat and rotate until the arrow points to the top to face the Qibla.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorMsg}</Text>
          </View>
        ) : !location || qiblaBearing == null ? (
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>Calculating Qibla direction...</Text>
          </View>
        ) : (
          <>
            <View style={styles.compassContainer}>
              <View style={[styles.compassCircle, { borderColor: colors.textSecondary }]}>
                <Text style={[styles.compassLabel, { color: colors.textSecondary }]}>N</Text>
                <Animated.View
                  style={[
                    styles.arrowContainer,
                    { transform: [{ rotate: rotationInterpolate }] },
                  ]}
                >
                  <Ionicons name="compass" size={56} color={colors.text} />
                  <Text style={[styles.arrowText, { color: colors.textSecondary }]}>Qibla</Text>
                </Animated.View>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • For best accuracy, hold the phone flat (screen facing the sky).
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Keep it away from metal objects or magnets.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Slowly rotate yourself until the Qibla arrow points straight up.
              </Text>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassLabel: {
    position: 'absolute',
    top: 10,
    fontWeight: '600',
  },
  arrowContainer: {
    alignItems: 'center',
  },
  arrowText: {
    marginTop: 4,
    fontSize: 14,
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
  },
});





