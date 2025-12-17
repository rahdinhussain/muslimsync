import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function MosqueScheduleScreen({ route }) {
  const { colors, isDark } = useTheme();
  const { mosque } = route.params || {};

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
      paddingHorizontal: 25,
      paddingVertical: 15,
      borderRadius: 15,
      alignItems: 'center',
      flex: 1,
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
      marginLeft: 8,
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
  });

  if (!mosque) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <Text style={dynamicStyles.errorText}>No mosque information available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const prayerNames = {
    Fajr: { name: 'Fajr', icon: 'sunny', color: '#FFA500' },
    Dhuhr: { name: 'Dhuhr', icon: 'sunny', color: '#FFD700' },
    Asr: { name: 'Asr', icon: 'partly-sunny', color: '#FF8C00' },
    Maghrib: { name: 'Maghrib', icon: 'moon', color: '#FF6347' },
    Isha: { name: 'Isha', icon: 'moon', color: '#4B0082' },
  };

  const handleCall = () => {
    if (mosque.phone) {
      Linking.openURL(`tel:${mosque.phone}`);
    }
  };

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.mosqueIconContainer}>
          <Ionicons name="location" size={40} color={colors.text} />
        </View>
        <Text style={dynamicStyles.mosqueName}>{mosque.name}</Text>
        <Text style={dynamicStyles.mosqueAddress}>{mosque.address}</Text>
      </View>

      <View style={styles.actionsContainer}>
        {mosque.phone && (
          <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={colors.text} />
            <Text style={dynamicStyles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={dynamicStyles.actionButton}
          onPress={handleDirections}
        >
          <Ionicons name="navigate" size={24} color={colors.text} />
          <Text style={dynamicStyles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleContainer}>
        <Text style={dynamicStyles.sectionTitle}>Prayer Schedule</Text>
        <Text style={dynamicStyles.sectionSubtitle}>Today's Prayer Times</Text>

        {Object.entries(prayerNames).map(([key, prayer]) => (
          <View key={key} style={dynamicStyles.prayerCard}>
            <View style={dynamicStyles.prayerIconContainer}>
              <Ionicons name={prayer.icon} size={28} color={prayer.color} />
            </View>
            <View style={styles.prayerInfo}>
              <Text style={dynamicStyles.prayerName}>{prayer.name}</Text>
              <Text style={dynamicStyles.prayerTime}>
                {mosque.prayerTimes?.[key] || '--:--'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <View style={dynamicStyles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.text} />
          <View style={styles.infoContent}>
            <Text style={dynamicStyles.infoTitle}>About This Mosque</Text>
            <Text style={dynamicStyles.infoText}>
              Visit this mosque for congregational prayers and community events.
              Prayer times may vary slightly, so it's recommended to confirm with
              the mosque directly.
            </Text>
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
    padding: 20,
    justifyContent: 'space-around',
  },
  scheduleContainer: {
    padding: 20,
  },
  prayerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
});

