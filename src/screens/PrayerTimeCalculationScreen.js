import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prayer time calculation methods
const PRAYER_METHODS = [
  { id: 0, name: 'Shia Ithna-Ansari', fajr: '15.0°', isha: '15.0°' },
  { id: 1, name: 'University of Islamic Sciences, Karachi', fajr: '18.0°', isha: '18.0°' },
  { id: 2, name: 'Islamic Society of North America (ISNA)', fajr: '15.0°', isha: '15.0°' },
  { id: 3, name: 'Muslim World League (MWL)', fajr: '18.0°', isha: '17.0°' },
  { id: 4, name: 'Umm Al-Qura University, Makkah', fajr: '18.5°', isha: '90 min' },
  { id: 5, name: 'Egyptian General Authority of Survey', fajr: '19.5°', isha: '17.5°' },
  { id: 6, name: 'Institute of Geophysics, University of Tehran', fajr: '17.7°', isha: '14.0°' },
  { id: 7, name: 'Gulf Region', fajr: '19.5°', isha: '19.5°' },
  { id: 8, name: 'Kuwait', fajr: '18.0°', isha: '17.5°' },
  { id: 9, name: 'Qatar', fajr: '18.0°', isha: '18.0°' },
  { id: 10, name: 'Majlis Ugama Islam Singapura (MUIS)', fajr: '20.0°', isha: '18.0°' },
  { id: 11, name: 'Union des Organisations Islamiques de France (UOIF)', fajr: '12.0°', isha: '12.0°' },
  { id: 12, name: 'Diyanet İşleri Başkanlığı, Turkey', fajr: '18.0°', isha: '17.0°' },
  { id: 13, name: 'Spiritual Administration of Muslims of Russia', fajr: '16.0°', isha: '15.0°' },
  { id: 14, name: 'Moonsighting Committee Worldwide (MCCW)', fajr: '18.0°', isha: '18.0°' },
  { id: 15, name: 'Dubai (Custom)', fajr: '18.2°', isha: '18.2°' },
];

const STORAGE_KEY = '@prayer_calculation_method';

export default function PrayerTimeCalculationScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState(2); // Default: ISNA (method 2)

  useEffect(() => {
    loadPrayerMethod();
  }, []);

  const loadPrayerMethod = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setSelectedMethod(parseInt(saved, 10));
      }
    } catch (error) {
      console.log('Error loading prayer method:', error);
    }
  };

  const handlePrayerMethodChange = async (methodId) => {
    try {
      setSelectedMethod(methodId);
      await AsyncStorage.setItem(STORAGE_KEY, methodId.toString());
      Alert.alert('Success', 'Prayer time calculation method updated. Please refresh prayer times to see the changes.');
    } catch (error) {
      console.error('Error saving prayer method:', error);
      Alert.alert('Error', 'Failed to save prayer method preference.');
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
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
      backgroundColor: colors.header,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    backButton: {
      padding: 5,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    optionCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDetails: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    radioButton: {
      marginLeft: 10,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={dynamicStyles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Prayer Time Calculation</Text>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={true}>
          {PRAYER_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={dynamicStyles.optionCard}
              onPress={() => handlePrayerMethodChange(method.id)}
            >
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionTitle}>{method.name}</Text>
                <Text style={dynamicStyles.optionDetails}>
                  Fajr: {method.fajr} | Isha: {method.isha}
                </Text>
              </View>
              <Ionicons
                name={selectedMethod === method.id ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={selectedMethod === method.id ? colors.text : colors.textSecondary}
                style={dynamicStyles.radioButton}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}






