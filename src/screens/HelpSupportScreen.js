import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


export default function HelpSupportScreen() {
  const { locale, isRTL } = useAppLocale();

  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const handleEmailPress = () => {
    const email = 'contact@muslimsync.com';
    const subject = tr('helpSupport.emailSubject');
    const body = tr('helpSupport.emailBody');
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        // Fallback: copy email to clipboard or show alert
        Alert.alert(tr("helpSupport.email"), tr("helpSupport.pleaseSendAnEmailToValue", { value1: email }));
      }
    }).catch(() => {
      // Error opening email (non-critical)
    });
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
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    sectionText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    contactCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    contactTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    emailButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardSecondary,
      padding: 15,
      borderRadius: 10,
      marginTop: 10,
    },
    emailText: {
      fontSize: 16,
      color: colors.text,
      marginStart: 10,
      flex: 1,
    },
    faqItem: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });

  const faqs = [
    {
      question: tr("helpSupport.howDoIChangePrayerTimesCalculationMethod"),
      answer: tr("helpSupport.goToSettingsPrayerTimeCalculationAndSelect"),
    },
    {
      question: tr("helpSupport.canIUseTheAppOffline"),
      answer: tr("helpSupport.yesYouCanDownloadTheQuranTranslationsAnd"),
    },
    {
      question: tr("helpSupport.howDoIFindNearbyMosques"),
      answer: tr("helpSupport.openTheMosquesTabAndAllowLocationAccess"),
    },
    {
      question: tr("helpSupport.isTheAppReallyAdFree"),
      answer: tr("helpSupport.yesMuslimSyncIs100AdFreeWe"),
    },
    {
      question: tr("helpSupport.howCanIProvideFeedback"),
      answer: tr("helpSupport.weWelcomeAllFeedbackSendUsAnEmail"),
    },
  ];

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
          <Text style={dynamicStyles.headerTitle}>{tr("navigation.help", { ns: 'common' })}</Text>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={true}>
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>{tr("helpSupport.getHelp")}</Text>
            <Text style={dynamicStyles.sectionText}>{tr("helpSupport.needAssistanceWeReHereToHelpReach")}</Text>
          </View>

          <View style={dynamicStyles.contactCard}>
            <Text style={dynamicStyles.contactTitle}>{tr("helpSupport.contactUs")}</Text>
            <Text style={dynamicStyles.sectionText}>{tr("helpSupport.haveAQuestionSuggestionOrNeedHelpSend")}</Text>
            <TouchableOpacity
              style={dynamicStyles.emailButton}
              onPress={handleEmailPress}
            >
              <Ionicons name="mail" size={24} color={colors.text} />
              <Text style={dynamicStyles.emailText}>contact@muslimsync.com</Text>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>{tr("helpSupport.frequentlyAskedQuestions")}</Text>
            
            {faqs.map((faq, index) => (
              <View key={index} style={dynamicStyles.faqItem}>
                <Text style={dynamicStyles.faqQuestion}>{faq.question}</Text>
                <Text style={dynamicStyles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </View>

          <View style={[dynamicStyles.contactCard, { marginTop: 10 }]}>
            <Text style={dynamicStyles.contactTitle}>{tr("helpSupport.moreInformation")}</Text>
            <Text style={[dynamicStyles.sectionText, { marginBottom: 15 }]}>{tr("about.visit")}{' '}
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

