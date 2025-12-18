import React, { useState, useEffect } from 'react';
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

export default function ThemeScreen() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation();

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
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
    optionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
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
    optionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    radioButton: {
      marginLeft: 10,
    },
  });

  const themeOptions = [
    {
      id: 'automatic',
      title: 'Automatic',
      description: 'Follow system theme',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'light',
      title: 'Light',
      description: 'Always use light mode',
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      title: 'Dark',
      description: 'Always use dark mode',
      icon: 'moon-outline',
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
          <Text style={dynamicStyles.headerTitle}>Theme</Text>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={true}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={dynamicStyles.optionCard}
              onPress={() => handleThemeChange(option.id)}
            >
              <View style={dynamicStyles.optionIcon}>
                <Ionicons name={option.icon} size={24} color={colors.text} />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionTitle}>{option.title}</Text>
                <Text style={dynamicStyles.optionDescription}>{option.description}</Text>
              </View>
              <Ionicons
                name={themeMode === option.id ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={themeMode === option.id ? colors.text : colors.textSecondary}
                style={dynamicStyles.radioButton}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


