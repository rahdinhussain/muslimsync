import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr, formatNumber } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


// Prayer time calculation methods


const STORAGE_KEY = '@prayer_calculation_method';

export default function PrayerTimeCalculationScreen() {
  const { locale, isRTL } = useAppLocale();

const PRAYER_METHODS = [
  { id: 0, name: tr("prayerTimeCalculation.shiaIthnaAnsari"), fajr: '15.0°', isha: '15.0°' },
  { id: 1, name: tr("prayerTimeCalculation.universityOfIslamicSciencesKarachi"), fajr: '18.0°', isha: '18.0°' },
  { id: 2, name: tr("prayerTimeCalculation.islamicSocietyOfNorthAmericaIsna"), fajr: '15.0°', isha: '15.0°' },
  { id: 3, name: tr("prayerTimeCalculation.muslimWorldLeagueMwl"), fajr: '18.0°', isha: '17.0°' },
  { id: 4, name: tr("prayerTimeCalculation.ummAlQuraUniversityMakkah"), fajr: '18.5°', isha: 90 },
  { id: 5, name: tr("prayerTimeCalculation.egyptianGeneralAuthorityOfSurvey"), fajr: '19.5°', isha: '17.5°' },
  { id: 6, name: tr("prayerTimeCalculation.instituteOfGeophysicsUniversityOfTehran"), fajr: '17.7°', isha: '14.0°' },
  { id: 7, name: tr("prayerTimeCalculation.gulfRegion"), fajr: '19.5°', isha: '19.5°' },
  { id: 8, name: tr("prayerTimeCalculation.kuwait"), fajr: '18.0°', isha: '17.5°' },
  { id: 9, name: tr("prayerTimeCalculation.qatar"), fajr: '18.0°', isha: '18.0°' },
  { id: 10, name: tr("prayerTimeCalculation.majlisUgamaIslamSingapuraMuis"), fajr: '20.0°', isha: '18.0°' },
  { id: 11, name: tr("prayerTimeCalculation.unionDesOrganisationsIslamiquesDeFranceUoif"), fajr: '12.0°', isha: '12.0°' },
  { id: 12, name: tr("prayerTimeCalculation.diyanetLeriBaKanlTurkey"), fajr: '18.0°', isha: '17.0°' },
  { id: 13, name: tr("prayerTimeCalculation.spiritualAdministrationOfMuslimsOfRussia"), fajr: '16.0°', isha: '15.0°' },
  { id: 14, name: tr("prayerTimeCalculation.moonsightingCommitteeWorldwideMccw"), fajr: '18.0°', isha: '18.0°' },
  { id: 15, name: tr("prayerTimeCalculation.dubaiCustom"), fajr: '18.2°', isha: '18.2°' },
];

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
      // Error loading prayer method (non-critical)
    }
  };

  const handlePrayerMethodChange = async (methodId) => {
    try {
      setSelectedMethod(methodId);
      await AsyncStorage.setItem(STORAGE_KEY, methodId.toString());
      Alert.alert(tr("dua.success"), tr("prayerTimeCalculation.prayerTimeCalculationMethodUpdatedPleaseRefreshPrayer"));
    } catch (error) {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("prayerTimeCalculation.failedToSavePrayerMethodPreference"));
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
      marginEnd: 10,
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
      marginStart: 10,
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
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{tr("settings.prayerCalculation", { ns: 'common' })}</Text>
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
                <Text style={dynamicStyles.optionDetails}>{tr("prayerTimeCalculation.fajrValueIshaValue", { value1: `${formatNumber(parseFloat(method.fajr), { minimumFractionDigits: 1 })}°`, value2: typeof method.isha === 'number' ? formatNumber(method.isha, { style: 'unit', unit: 'minute', unitDisplay: 'short' }) : `${formatNumber(parseFloat(method.isha), { minimumFractionDigits: 1 })}°` })}</Text>
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






