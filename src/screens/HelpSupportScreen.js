import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

export default function HelpSupportScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const handleEmailPress = () => {
    const email = 'contact@muslimsync.com';
    const subject = 'Help & Support - Muslim Sync';
    const body = 'Hello,\n\nI need help with:\n\n';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        // Fallback: copy email to clipboard or show alert
        Alert.alert('Email', `Please send an email to ${email}`);
      }
    }).catch(err => {
      console.error('Error opening email:', err);
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
      marginLeft: 10,
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
      question: 'How do I change prayer times calculation method?',
      answer: 'Go to Settings > Prayer Time Calculation and select your preferred method. The app supports 15 different calculation methods including ISNA, MWL, and others.',
    },
    {
      question: 'Can I use the app offline?',
      answer: 'Yes! You can download the Quran, translations, and audio recitations for offline use. Go to the Quran screen, tap the menu icon, and use the download options.',
    },
    {
      question: 'How do I find nearby mosques?',
      answer: 'Open the Mosques tab and allow location access. The app will show all mosques in your city, sorted by distance with the closest ones first.',
    },
    {
      question: 'Is the app really ad-free?',
      answer: 'Yes! Muslim Sync is 100% ad-free. We believe in providing a clean, distraction-free experience for all users.',
    },
    {
      question: 'How can I provide feedback?',
      answer: 'We welcome all feedback! Send us an email at contact@muslimsync.com with your suggestions. InshaAllah, we will continue to add features based on your needs.',
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
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Help & Support</Text>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={true}>
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Get Help</Text>
            <Text style={dynamicStyles.sectionText}>
              Need assistance? We're here to help! Reach out to us through email and we'll get back to you as soon as possible.
            </Text>
          </View>

          <View style={dynamicStyles.contactCard}>
            <Text style={dynamicStyles.contactTitle}>Contact Us</Text>
            <Text style={dynamicStyles.sectionText}>
              Have a question, suggestion, or need help? Send us an email and we'll respond promptly.
            </Text>
            <TouchableOpacity
              style={dynamicStyles.emailButton}
              onPress={handleEmailPress}
            >
              <Ionicons name="mail" size={24} color={colors.text} />
              <Text style={dynamicStyles.emailText}>contact@muslimsync.com</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Frequently Asked Questions</Text>
            
            {faqs.map((faq, index) => (
              <View key={index} style={dynamicStyles.faqItem}>
                <Text style={dynamicStyles.faqQuestion}>{faq.question}</Text>
                <Text style={dynamicStyles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

