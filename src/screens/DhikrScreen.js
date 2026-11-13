import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '../components/LocalizedPrimitives';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { tr, formatNumber } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';




export default function DhikrScreen() {
  const { locale, isRTL } = useAppLocale();

const DHIKR_CATEGORIES = [
  {
    id: 'morning',
    title: tr("dhikr.morningDhikr"),
    color: '#FFA500',
    dhikrs: [
      { id: 1, text: 'Subhanallah', arabic: 'سُبْحَانَ اللَّهِ', count: 33 },
      { id: 2, text: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', count: 33 },
      { id: 3, text: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', count: 33 },
      { id: 4, text: 'La ilaha illa Allah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', count: 100 },
    ],
  },
  {
    id: 'evening',
    title: tr("dhikr.eveningDhikr"),
    color: '#4B0082',
    dhikrs: [
      { id: 5, text: 'Subhanallah', arabic: 'سُبْحَانَ اللَّهِ', count: 33 },
      { id: 6, text: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', count: 33 },
      { id: 7, text: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', count: 33 },
      { id: 8, text: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّه', count: 100 },
    ],
  },
  {
    id: 'general',
    title: tr("dhikr.generalDhikr"),
    color: '#000000',
    dhikrs: [
      { id: 9, text: 'Subhanallah wa Bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', count: 100 },
      { id: 10, text: 'La hawla wa la quwwata illa billah', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', count: 100 },
      { id: 11, text: 'Hasbunallahu wa ni\'mal wakeel', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', count: 100 },
    ],
  },
];

  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDhikr, setSelectedDhikr] = useState(null);
  const [counts, setCounts] = useState({});
  const [customDhikr, setCustomDhikr] = useState('');

  const loadCounts = async () => {
    try {
      const savedCounts = await AsyncStorage.getItem('dhikr_counts');
      if (savedCounts) {
        setCounts(JSON.parse(savedCounts));
      }
    } catch (error) {
      // Error loading counts (non-critical)
    }
  };

  React.useEffect(() => {
    loadCounts();
  }, []);

  const saveCount = async (dhikrId, count) => {
    try {
      const newCounts = { ...counts, [dhikrId]: count };
      setCounts(newCounts);
      await AsyncStorage.setItem('dhikr_counts', JSON.stringify(newCounts));
    } catch (error) {
      // Error saving count (non-critical)
    }
  };

  const incrementCount = (dhikrId) => {
    const currentCount = counts[dhikrId] || 0;
    const newCount = currentCount + 1;
    saveCount(dhikrId, newCount);
  };

  const resetCount = (dhikrId) => {
    saveCount(dhikrId, 0);
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
    categoryCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 25,
      marginBottom: 20,
      alignItems: 'center',
      borderWidth: 0,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    categoryIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    categoryTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    categoryCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    categoryHeader: {
      padding: 20,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryHeaderTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginStart: 15,
    },
    dhikrCard: {
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
    dhikrCardText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 5,
    },
    dhikrCardArabic: {
      writingDirection: 'rtl',
      fontSize: 16,
      color: colors.text,
      marginBottom: 5,
    },
    dhikrCardCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    dhikrCardCurrentCount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginEnd: 10,
    },
    dhikrHeader: {
      padding: 20,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dhikrHeaderTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    dhikrHeaderArabic: {
      writingDirection: 'rtl',
      fontSize: 18,
      color: colors.textSecondary,
    },
    counterCircle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    counterText: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.text,
    },
    counterTarget: {
      fontSize: 18,
      color: colors.textSecondary,
      marginTop: 5,
    },
    progressBar: {
      width: '80%',
      height: 10,
      backgroundColor: colors.borderVisible,
      borderRadius: 5,
      overflow: 'hidden',
    },
    counterButton: {
      width: '80%',
      padding: 20,
      borderRadius: 15,
      alignItems: 'center',
      marginBottom: 15,
    },
    counterButtonText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 5,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: 15,
      borderWidth: 0,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginStart: 8,
    },
  });

  if (selectedDhikr) {
    const category = DHIKR_CATEGORIES.find((cat) =>
      cat.dhikrs.some((d) => d.id === selectedDhikr.id)
    );
    const currentCount = counts[selectedDhikr.id] || 0;
    const progress = (currentCount / selectedDhikr.count) * 100;

    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View style={[dynamicStyles.dhikrHeader, { backgroundColor: colors.cardSecondary }]}>
          <TouchableOpacity
            onPress={() => setSelectedDhikr(null)}
            style={styles.backButton}
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.dhikrHeaderInfo}>
            <Text style={dynamicStyles.dhikrHeaderTitle}>{selectedDhikr.text}</Text>
            <Text style={dynamicStyles.dhikrHeaderArabic}>{selectedDhikr.arabic}</Text>
          </View>
        </View>

        <View style={styles.counterContainer}>
          <View style={dynamicStyles.counterCircle}>
            <Text style={dynamicStyles.counterText}>{formatNumber(currentCount)}</Text>
            <Text style={dynamicStyles.counterTarget}>/ {formatNumber(selectedDhikr.count)}</Text>
          </View>
          <View style={dynamicStyles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: colors.text },
              ]}
            />
          </View>
        </View>

        <View style={styles.counterActions}>
          <TouchableOpacity
            style={[dynamicStyles.counterButton, { backgroundColor: colors.cardSecondary }]}
            onPress={() => incrementCount(selectedDhikr.id)}
          >
            <Ionicons name="add" size={32} color={colors.text} />
            <Text style={dynamicStyles.counterButtonText}>{tr("dhikr.count")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.resetButton}
            onPress={() => resetCount(selectedDhikr.id)}
          >
            <Ionicons name="refresh" size={24} color={colors.text} />
            <Text style={[dynamicStyles.resetButtonText, { color: colors.text }]}>{tr("actions.reset", { ns: 'common' })}</Text>
          </TouchableOpacity>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedCategory) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View
            style={[
              dynamicStyles.categoryHeader,
              { backgroundColor: colors.cardSecondary },
            ]}
          >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={styles.backButton}
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.categoryHeaderTitle}>
            {DHIKR_CATEGORIES.find(category => category.id === selectedCategory.id)?.title || selectedCategory.title}
          </Text>
        </View>

        <ScrollView style={styles.dhikrList}>
          {selectedCategory.dhikrs.map((dhikr) => {
            const currentCount = counts[dhikr.id] || 0;
            return (
              <TouchableOpacity
                key={dhikr.id}
                style={dynamicStyles.dhikrCard}
                onPress={() => setSelectedDhikr(dhikr)}
              >
                <View style={styles.dhikrCardContent}>
                  <Text style={dynamicStyles.dhikrCardText}>{dhikr.text}</Text>
                  <Text style={dynamicStyles.dhikrCardArabic}>{dhikr.arabic}</Text>
                  <Text style={dynamicStyles.dhikrCardCount}>{tr("dhikr.targetValue", { value1: dhikr.count })}</Text>
                </View>
                <View style={styles.dhikrCardProgress}>
                  <Text style={dynamicStyles.dhikrCardCurrentCount}>{formatNumber(currentCount)}</Text>
                  <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={24} color={colors.text} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{tr("navigation.dhikr", { ns: 'common' })}</Text>
        <Text style={dynamicStyles.headerSubtitle}>{tr("dhikr.rememberAllahAndCountYourBlessings")}</Text>
      </View>

      <View style={styles.categoriesContainer}>
        {DHIKR_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={dynamicStyles.categoryCard}
            onPress={() => setSelectedCategory(category)}
          >
            <View
              style={[
                dynamicStyles.categoryIconContainer,
                { backgroundColor: colors.cardSecondary },
              ]}
            >
              <Ionicons name="heart" size={32} color={colors.text} />
            </View>
            <Text style={dynamicStyles.categoryTitle}>{category.title}</Text>
            <Text style={dynamicStyles.categoryCount}>{tr("dhikr.valueDhikrs", { value1: category.dhikrs.length })}</Text>
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  categoriesContainer: {
    padding: 20,
  },
  backButton: {
    padding: 5,
  },
  dhikrList: {
    flex: 1,
    padding: 20,
  },
  dhikrCardContent: {
    flex: 1,
  },
  dhikrCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dhikrHeaderInfo: {
    flex: 1,
    marginStart: 15,
  },
  counterContainer: {
    alignItems: 'center',
    padding: 40,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  counterActions: {
    padding: 20,
    alignItems: 'center',
  },
});

