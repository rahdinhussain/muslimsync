import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


export default function AboutScreen() {
  const { locale, isRTL } = useAppLocale();

  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

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
    aboutSection: {
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: 15,
      marginTop: 20,
    },
    appName: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 5,
      color: colors.text,
    },
    version: {
      fontSize: 14,
      marginBottom: 20,
      color: colors.textSecondary,
    },
    divider: {
      height: 1,
      width: '100%',
      marginVertical: 20,
      backgroundColor: colors.borderVisible || '#e0e0e0',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
      color: colors.text,
    },
    aboutText: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 10,
      color: colors.textSecondary,
    },
    inshaAllah: {
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
      fontWeight: '600',
      marginTop: 5,
      color: colors.text,
    },
    featuresList: {
      width: '100%',
      alignItems: 'flex-start',
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      width: '100%',
    },
    featureText: {
      fontSize: 16,
      marginStart: 12,
      color: colors.textSecondary,
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
          <Text style={dynamicStyles.headerTitle}>{tr("about.aboutMuslimSync")}</Text>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={true}>
          <View style={dynamicStyles.aboutSection}>
            <View style={dynamicStyles.logoContainer}>
              <Ionicons name="book" size={64} color={colors.text} />
            </View>
            
            <Text style={dynamicStyles.appName}>Muslim Sync</Text>
            <Text style={dynamicStyles.version}>{tr("about.version100")}</Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>{tr("about.ourMission")}</Text>
            <Text style={dynamicStyles.aboutText}>{tr("about.ourGoalIsToReduceTheNeedFor")}</Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>{tr("about.100AdFree")}</Text>
            <Text style={dynamicStyles.aboutText}>{tr("about.weBelieveInProvidingACleanDistractionFree")}</Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>{tr("about.yourFeedbackMatters")}</Text>
            <Text style={dynamicStyles.aboutText}>{tr("about.everyoneIsWelcomeToGiveFeedbackAboutWhat")}</Text>
            <Text style={dynamicStyles.inshaAllah}>{tr("about.inshaallahWeWillContinueToAddFeaturesBased")}</Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>{tr("about.features")}</Text>
            <View style={dynamicStyles.featuresList}>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>{tr("about.accuratePrayerTimes")}</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>{tr("about.completeQuranWithTranslations")}</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>{tr("about.dhikrCounter")}</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>{tr("about.dailyDuas")}</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>{tr("about.mosqueFinder")}</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>{tr("about.offlineSupport")}</Text>
              </View>
            </View>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={[dynamicStyles.aboutText, { marginTop: 10 }]}>{tr("about.visit")}{' '}
              <Text 
                style={{ color: '#007AFF', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://muslimsync.com')}
              >
                muslimsync.com
              </Text>
              {' '}{tr("about.forMoreInformation")}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

