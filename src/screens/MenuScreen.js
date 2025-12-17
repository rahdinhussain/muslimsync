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

export default function MenuScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const menuItems = [
    {
      id: 1,
      title: 'Theme',
      icon: 'color-palette',
      onPress: () => navigation.navigate('Theme'),
    },
    {
      id: 2,
      title: 'Prayer Time Calculation',
      icon: 'time',
      onPress: () => navigation.navigate('PrayerTimeCalculation'),
    },
    {
      id: 3,
      title: 'About',
      icon: 'information-circle',
      onPress: () => navigation.navigate('About'),
    },
    {
      id: 4,
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

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
      backgroundColor: colors.header,
      padding: 25,
      paddingTop: 10,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    menuItem: {
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
    menuItemIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    menuItemTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>Settings</Text>
          <Text style={dynamicStyles.headerSubtitle}>
            App settings and information
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <View key={item.id}>
              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={item.onPress}
              >
                <View style={dynamicStyles.menuItemIcon}>
                  <Ionicons name={item.icon} size={24} color={colors.text} />
                </View>
                <Text style={dynamicStyles.menuItemTitle}>{item.title}</Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    padding: 20,
  },
});

