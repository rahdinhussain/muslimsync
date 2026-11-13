import { LocalizedSafeAreaView as SafeAreaView } from './LocalizedPrimitives';
import { LocalizedText as Text } from './LocalizedPrimitives';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import {
  RECITERS,
  getReciterName,
  TRANSLATIONS,
  getSelectedReciter,
  getSelectedTranslation,
  saveSelectedReciter,
  saveSelectedTranslation,
} from '../utils/quranStorage';
import { tr } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


export default function QuranDownloadModal({ visible, onClose, onDownload }) {
  const { locale, isRTL } = useAppLocale();

  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [selectedTranslation, setSelectedTranslation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSelections();
  }, []);

  const loadSelections = async () => {
    const reciter = await getSelectedReciter();
    const translation = await getSelectedTranslation();
    setSelectedReciter(reciter || RECITERS[0].id);
    setSelectedTranslation(translation || TRANSLATIONS[0].id);
  };

  const handleDownload = async () => {
    if (!selectedReciter || !selectedTranslation) {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("quranDownloadModal.pleaseSelectBothAReciterAndTranslation"));
      return;
    }

    setLoading(true);
    try {
      await saveSelectedReciter(selectedReciter);
      await saveSelectedTranslation(selectedTranslation);
      if (onDownload) {
        await onDownload(selectedReciter, selectedTranslation);
      }
      Alert.alert(tr("dua.success"), tr("quranDownloadModal.downloadSettingsSavedYouCanNowDownloadContent"));
      onClose();
    } catch (error) {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("quranDownloadModal.failedToSaveSettings"));
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      paddingTop: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Math.max(insets.top, 20), // Use safe area inset or minimum 20
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderVisible,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 20,
      marginBottom: 15,
      paddingHorizontal: 20,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 15,
      marginHorizontal: 20,
      marginBottom: 10,
    },
    optionCardSelected: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginStart: 12,
    },
    downloadButton: {
      backgroundColor: colors.text,
      marginHorizontal: 20,
      marginVertical: 20,
      padding: 18,
      borderRadius: 15,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    downloadButtonText: {
      color: colors.surface,
      fontSize: 18,
      fontWeight: 'bold',
      marginStart: 10,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      paddingHorizontal: 20,
      marginTop: 10,
      lineHeight: 20,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={dynamicStyles.modalOverlay} edges={[]}>
        <View style={dynamicStyles.modalContent}>
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>{tr("quranDownloadModal.downloadSettings")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={dynamicStyles.infoText}>{tr("quranDownloadModal.selectYourPreferredReciterAndTranslationYouCan")}</Text>

            <Text style={dynamicStyles.sectionTitle}>{tr("quranDownloadModal.selectReciter")}</Text>
            {RECITERS.map((reciter) => (
              <TouchableOpacity
                key={reciter.id}
                style={[
                  dynamicStyles.optionCard,
                  selectedReciter === reciter.id && dynamicStyles.optionCardSelected,
                ]}
                onPress={() => setSelectedReciter(reciter.id)}
              >
                <Ionicons
                  name={selectedReciter === reciter.id ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={selectedReciter === reciter.id ? colors.text : colors.textSecondary}
                />
                <Text style={dynamicStyles.optionText}>{getReciterName(reciter)}</Text>
              </TouchableOpacity>
            ))}

            <Text style={dynamicStyles.sectionTitle}>{tr("quranDownloadModal.selectTranslation")}</Text>
            {TRANSLATIONS.map((translation) => (
              <TouchableOpacity
                key={translation.id}
                style={[
                  dynamicStyles.optionCard,
                  selectedTranslation === translation.id && dynamicStyles.optionCardSelected,
                ]}
                onPress={() => setSelectedTranslation(translation.id)}
              >
                <Ionicons
                  name={selectedTranslation === translation.id ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={selectedTranslation === translation.id ? colors.text : colors.textSecondary}
                />
                <Text style={dynamicStyles.optionText}>{translation.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={dynamicStyles.downloadButton}
              onPress={handleDownload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="download" size={24} color={colors.surface} />
                  <Text style={dynamicStyles.downloadButtonText}>{tr("quranDownloadModal.saveSettings")}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

