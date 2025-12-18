import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@muslim_sync_theme';
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('automatic');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode); // Update state immediately for instant UI update
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine actual theme based on mode
  const isDark = themeMode === 'automatic' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';
  
  const colors = getColors(isDark);
  
  const value = {
    colors,
    isDark,
    colorScheme: systemColorScheme,
    themeMode,
    setThemeMode: saveThemePreference,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


