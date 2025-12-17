import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

export default function AboutScreen() {
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
      marginLeft: 12,
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
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>About Muslim Sync</Text>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={true}>
          <View style={dynamicStyles.aboutSection}>
            <View style={dynamicStyles.logoContainer}>
              <Ionicons name="book" size={64} color={colors.text} />
            </View>
            
            <Text style={dynamicStyles.appName}>Muslim Sync</Text>
            <Text style={dynamicStyles.version}>Version 1.0.0</Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>Our Mission</Text>
            <Text style={dynamicStyles.aboutText}>
              Our goal is to reduce the need for multiple tools and help you get everything in one convenient app. 
              Muslim Sync brings together all the essential Islamic tools you need for your daily spiritual journey.
            </Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>100% Ad-Free</Text>
            <Text style={dynamicStyles.aboutText}>
              We believe in providing a clean, distraction-free experience. Muslim Sync is completely ad-free, 
              allowing you to focus on what matters most - your connection with Allah.
            </Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>Your Feedback Matters</Text>
            <Text style={dynamicStyles.aboutText}>
              Everyone is welcome to give feedback about what they want to be added. We value your input and 
              suggestions to make Muslim Sync better for the entire Muslim community.
            </Text>
            <Text style={dynamicStyles.inshaAllah}>
              InshaAllah, we will continue to add features based on your needs.
            </Text>
            
            <View style={dynamicStyles.divider} />
            
            <Text style={dynamicStyles.sectionTitle}>Features</Text>
            <View style={dynamicStyles.featuresList}>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>Accurate Prayer Times</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>Complete Quran with Translations</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>Dhikr Counter</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>Daily Duas</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>Mosque Finder</Text>
              </View>
              <View style={dynamicStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} />
                <Text style={dynamicStyles.featureText}>Offline Support</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

