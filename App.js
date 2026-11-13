import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, I18nManager } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { loadArabicFonts } from './src/utils/fontLoader';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider, useAppLocale } from './src/context/LocaleContext';
import { tr } from './src/i18n';
import LanguageScreen from './src/screens/LanguageScreen';

// Screens
import PrayerTimesScreen from './src/screens/PrayerTimesScreen';
import QuranScreen from './src/screens/QuranScreen';
import DhikrScreen from './src/screens/DhikrScreen';
import DuaScreen from './src/screens/DuaScreen';
import MosqueFinderScreen from './src/screens/MosqueFinderScreen';
import MosqueScheduleScreen from './src/screens/MosqueScheduleScreen';
import MenuScreen from './src/screens/MenuScreen';
import AboutScreen from './src/screens/AboutScreen';
import ThemeScreen from './src/screens/ThemeScreen';
import PrayerTimeCalculationScreen from './src/screens/PrayerTimeCalculationScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import QiblaScreen from './src/screens/QiblaScreen';
import LocationSettingsScreen from './src/screens/LocationSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  const { isRTL } = useAppLocale();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureDirection: isRTL === I18nManager.isRTL ? 'horizontal' : 'horizontal-inverted',
        cardStyle: { direction: isRTL ? 'rtl' : 'ltr' },
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={PrayerTimesScreen}
      />
      <Stack.Screen 
        name="Qibla" 
        component={QiblaScreen}
      />
    </Stack.Navigator>
  );
}

function MosqueStack() {
  const { isRTL } = useAppLocale();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureDirection: isRTL === I18nManager.isRTL ? 'horizontal' : 'horizontal-inverted',
        cardStyle: { direction: isRTL ? 'rtl' : 'ltr' },
      }}
    >
      <Stack.Screen 
        name="MosqueFinder" 
        component={MosqueFinderScreen}
      />
      <Stack.Screen 
        name="MosqueSchedule" 
        component={MosqueScheduleScreen}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const { isRTL } = useAppLocale();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureDirection: isRTL === I18nManager.isRTL ? 'horizontal' : 'horizontal-inverted',
        cardStyle: { direction: isRTL ? 'rtl' : 'ltr' },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={MenuScreen}
      />
      <Stack.Screen 
        name="Theme" 
        component={ThemeScreen}
      />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen 
        name="Location" 
        component={LocationSettingsScreen}
      />
      <Stack.Screen 
        name="PrayerTimeCalculation" 
        component={PrayerTimeCalculationScreen}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
      />
      <Stack.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isDark, colors, themeMode } = useTheme();
  const { isRTL } = useAppLocale();
  
  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.text,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: 'transparent',
          notification: colors.text,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        key={themeMode} // Force re-render when theme changes
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Dua') {
              return <Ionicons name={focused ? 'hand-left' : 'hand-left-outline'} size={size} color={color} />;
            }

            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Quran') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Dhikr') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Mosques') {
              iconName = focused ? 'location' : 'location-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            direction: isRTL ? 'rtl' : 'ltr',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{ tabBarLabel: tr('navigation.home', { ns: 'common' }) }}
        />
        <Tab.Screen 
          name="Quran" 
          component={QuranScreen}
          options={{ tabBarLabel: tr('navigation.quran', { ns: 'common' }) }}
        />
        <Tab.Screen 
          name="Dhikr" 
          component={DhikrScreen}
          options={{ tabBarLabel: tr('navigation.dhikr', { ns: 'common' }) }}
        />
        <Tab.Screen 
          name="Dua" 
          component={DuaScreen}
          options={{ tabBarLabel: tr('navigation.duas', { ns: 'common' }) }}
        />
        <Tab.Screen 
          name="Mosques" 
          component={MosqueStack}
          options={{ tabBarLabel: tr('navigation.mosques', { ns: 'common' }) }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsStack}
          options={{ tabBarLabel: tr('navigation.settings', { ns: 'common' }) }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function LocalizedApp() {
  const { ready, needsChoice, isRTL } = useAppLocale();
  const { colors } = useTheme();
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.text} /></View>;
  }
  // Direction belongs to the chosen app language. Explicit subtree direction
  // avoids forcing a global native RTL flag or requiring an application restart.
  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      {needsChoice ? <LanguageScreen onboarding /> : <AppContent />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadArabicFonts().then(() => {
      setFontsLoaded(true);
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <LocalizedApp />
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
