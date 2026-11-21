import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '../components/LocalizedPrimitives';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import QuranDownloadModal from '../components/QuranDownloadModal';
import AudioPlayer from '../components/AudioPlayer';
import QuranSettingsDrawer from '../components/QuranSettingsDrawer';
import {
  getSurahVerses,
  saveSurahVerses,
  isSurahDownloaded,
  getSelectedReciter,
  getSelectedTranslation,
  addBookmark,
  removeBookmark,
  getBookmarks,
  isBookmarked as checkBookmark,
  getSurahTranslation,
  TRANSLATIONS,
  RECITERS,
  getReciterName,
} from '../utils/quranStorage';

import { SURAHS } from '../data/surahs';
import { getFontFamily } from '../utils/fontLoader';
import { tr, formatNumber } from '../i18n';
import chapter from '../utils/quranChapter.cjs';
import { saveChapterTranslation } from '../utils/quranStorage';
import { useAppLocale } from '../context/LocaleContext';


const VERSES_PER_PAGE = 20; // Pagination

export default function QuranScreen() {
  const { locale, isRTL } = useAppLocale();

  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [result, setResult] = useState(null);
  const [reload, setReload] = useState(0);
  const listRef = useRef(null);
  const pendingBookmark = useRef(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [reciterId, setReciterId] = useState(null);
  const [translationId, setTranslationId] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [verseBookmarks, setVerseBookmarks] = useState({});
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [arabicFont, setArabicFont] = useState('system');
  const [fontSize, setFontSize] = useState(22);
  const [recitationLanguageLabel, setRecitationLanguageLabel] = useState(null);

  useEffect(() => {
    // Load settings and bookmarks asynchronously without blocking
    Promise.all([
      loadSettings().catch(() => {}),
      loadBookmarks().catch(() => {})
    ]);
  }, []);

  const requestKey = selectedSurah ? [selectedSurah.number, translationId, reload].join(':') : null;
  const verses = result?.key === requestKey ? result.rows : [];
  const loadingVerses = Boolean(requestKey && result?.key !== requestKey);
  useEffect(() => {
    if (!selectedSurah) return;
    const controller = new AbortController();
    const signal = controller.signal;
    async function read() {
      const n = selectedSurah.number;
      let arabic = await getSurahVerses(n);
      if (!chapter.validate(arabic, selectedSurah.ayahs)) {
        arabic = await chapter.fetchChapter(selectedSurah, null, signal);
        if (!signal.aborted) await saveSurahVerses(n, arabic);
      }
      if (signal.aborted) return;
      let translation = null;
      if (translationId) {
        try {
          translation = await getSurahTranslation(n, translationId);
          if (!chapter.validate(translation, selectedSurah.ayahs)) {
            translation = await chapter.fetchChapter(selectedSurah, translationId, signal);
            if (!signal.aborted) await saveChapterTranslation(n, translationId, translation).catch(() => {});
          }
        } catch { translation = null; }
      }
      if (!signal.aborted) setResult({key: requestKey, rows: arabic.map((verse, i) => ({
        number: verse.number, text: verse.text, translation: translation?.[i]?.text || null
      })), missingTranslation: Boolean(translationId && !translation)});
    }
    read().catch(() => { if (!signal.aborted) setResult({key: requestKey, rows: []}); });
    return () => controller.abort();
  }, [selectedSurah, translationId, requestKey]);

  const loadSettings = async () => {
    const reciter = await getSelectedReciter();
    const translation = await getSelectedTranslation();
    setReciterId(reciter);
    setTranslationId(translation);
    
    // Load font settings
    try {
      const font = await AsyncStorage.getItem('@quran_arabic_font');
      const size = await AsyncStorage.getItem('@quran_font_size');
      if (font) setArabicFont(font);
      if (size) setFontSize(parseInt(size, 10));
    } catch (error) {
      // Error loading font settings (non-critical)
    }
  };
  useEffect(() => {
    if (!reciterId) {
      setRecitationLanguageLabel(null);
      return;
    }
    const reciter = RECITERS.find(r => r.id === reciterId);
    if (reciter) {
      if (reciter.id === 'arabic_english_r2') {
        setRecitationLanguageLabel(tr('quran.recitationBilingual', { name: getReciterName(reciter) }));
      } else {
        setRecitationLanguageLabel(tr('quran.recitationArabic', { name: getReciterName(reciter) }));
      }
      return;
    }
    setRecitationLanguageLabel(null);
  }, [reciterId, locale]);

  const loadBookmarks = async () => {
    const savedBookmarks = await getBookmarks();
    setBookmarks(savedBookmarks);
    const bookmarkMap = {};
    savedBookmarks.forEach((b) => {
      const key = `${b.surahNumber}_${b.verseNumber}`;
      bookmarkMap[key] = true;
    });
    setVerseBookmarks(bookmarkMap);
  };

  const handleDownload = async (reciter, translation) => {
    setReciterId(reciter);
    setTranslationId(translation);
    Alert.alert(tr("quran.info"), tr("quran.settingsSavedYouCanNowDownloadSurahsFor"));
  };

  const downloadSurah = async () => {
    if (!selectedSurah) {
      Alert.alert(tr("status.error", { ns: 'common' }), tr("quran.pleaseConfigureDownloadSettingsFirst"));
      setShowDownloadModal(true);
      return;
    }

    Alert.alert(
      tr("actions.download", { ns: 'common' }),
      tr("quran.downloadValueForOfflineUse", { value1: selectedSurah.name }),
      [
        { text: tr("actions.cancel", { ns: 'common' }), style: 'cancel' },
        {
          text: tr("actions.download", { ns: 'common' }),
          onPress: async () => {
            try {
              const text = chapter.validate(verses, selectedSurah.ayahs) ? verses : await chapter.fetchChapter(selectedSurah);
              await saveSurahVerses(selectedSurah.number, text, true);
              Alert.alert(tr("dua.success"), tr("quran.surahDownloadedSuccessfully"));
            } catch (error) {
              Alert.alert(tr("status.error", { ns: 'common' }), tr("quran.failedToDownloadSurah"));
            }
          },
        },
      ]
    );
  };

  const toggleBookmark = async (verseNumber) => {
    const key = `${selectedSurah.number}_${verseNumber}`;
    const isBooked = verseBookmarks[key];

    if (isBooked) {
      await removeBookmark(selectedSurah.number, verseNumber);
      const newMap = { ...verseBookmarks };
      delete newMap[key];
      setVerseBookmarks(newMap);
    } else {
      const verse = verses.find((v) => v.number === verseNumber);
      await addBookmark({
        surahNumber: selectedSurah.number,
        surahName: selectedSurah.name,
        verseNumber: verseNumber,
        verseText: verse?.text || '',
      });
      setVerseBookmarks({ ...verseBookmarks, [key]: true });
    }
    await loadBookmarks();
  };

  const shareVerse = async (verse) => {
    try {
      const shareText = `${tr('quran.valueVerseValue', { value1: selectedSurah.name, value2: verse.number })}\n\n${verse.text}\n\n${verse.translation || ''}`;
      await Share.share({
        message: shareText,
        title: tr("quran.valueVerseValue", { value1: selectedSurah.name, value2: verse.number }),
      });
    } catch (error) {
      // Error sharing (non-critical)
    }
  };

  // Search functionality - automatically searches surahs when on main list, verses when inside a surah
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) {
      return SURAHS;
    }
    const query = searchQuery.toLowerCase().trim();
    return SURAHS.filter(
      (surah) =>
        surah.name.toLowerCase().includes(query) ||
        surah.nameArabic.includes(searchQuery) ||
        surah.number.toString().includes(query)
    );
  }, [searchQuery]);

  const filteredVerses = useMemo(() => {
    if (!selectedSurah || !searchQuery.trim()) {
      return verses;
    }
    const query = searchQuery.toLowerCase().trim();
    return verses.filter(
      (verse) =>
        verse.text.includes(searchQuery) ||
        (verse.translation && verse.translation.toLowerCase().includes(query)) ||
        verse.number.toString().includes(query)
    );
  }, [verses, searchQuery, selectedSurah]);

  // Pagination
  const paginatedVerses = useMemo(() => {
    const start = (currentPage - 1) * VERSES_PER_PAGE;
    const end = start + VERSES_PER_PAGE;
    return filteredVerses.slice(start, end);
  }, [filteredVerses, currentPage]);

  const totalPages = Math.ceil(filteredVerses.length / VERSES_PER_PAGE);

  const renderSurahItem = ({ item }) => (
    <TouchableOpacity
      style={[dynamicStyles.surahCard, { backgroundColor: colors.card }]}
      onPress={() => {
        pendingBookmark.current = null;
        setCurrentPage(1);
        setSelectedSurah(item);
        setSearchQuery('');
      }}
    >
      <View style={[dynamicStyles.surahNumber, { backgroundColor: colors.iconBackground }]}>
        <Text style={dynamicStyles.surahNumberText}>{formatNumber(item.number)}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={dynamicStyles.surahName}>{item.name}</Text>
        <Text style={dynamicStyles.surahNameArabic}>{item.nameArabic}</Text>
        <Text style={dynamicStyles.surahAyahs}>{tr("quran.valueAyahs", { value1: item.ayahs })}</Text>
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderVerse = ({ item: verse }) => {
    const bookmarkKey = `${selectedSurah.number}_${verse.number}`;
    const isBooked = verseBookmarks[bookmarkKey];

    return (
      <View style={dynamicStyles.verseCard}>
        <View style={styles.verseHeader}>
          <View style={dynamicStyles.verseNumberContainer}>
            <Text style={dynamicStyles.verseNumber}>{formatNumber(verse.number)}</Text>
          </View>
          <View style={styles.verseActions}>
            <TouchableOpacity
              onPress={() => toggleBookmark(verse.number)}
              style={styles.verseActionButton}
            >
              <Ionicons
                name={isBooked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBooked ? colors.text : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => shareVerse(verse)}
              style={styles.verseActionButton}
            >
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[
          dynamicStyles.verseArabicBase,
          {
            fontSize: fontSize,
            lineHeight: fontSize * 1.8,
            fontFamily: getFontFamily(arabicFont),
          }
        ]}>{verse.text}</Text>
        {showTranslation && translationId && verse.translation && verse.translation.trim() !== '' ? (
          <>
            <Text style={dynamicStyles.verseTranslation}>{verse.translation}</Text>
            {translationId && (
              <Text style={dynamicStyles.translationName}>
                {TRANSLATIONS.find(t => t.id === translationId)?.name || translationId}
              </Text>
            )}
          </>
        ) : showTranslation && translationId && !verse.translation ? (
          <Text style={[dynamicStyles.verseTranslation, { fontStyle: 'italic', opacity: 0.7 }]}>{tr('quran.translationUnavailable', { ns: 'common' })}</Text>
        ) : null}
      </View>
    );
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: 15,
      borderRadius: 15,
      height: 50,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    surahCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 15,
      padding: 15,
      marginBottom: 12,
      marginHorizontal: 20,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    surahNumber: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 15,
    },
    surahNumberText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    surahName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    surahNameArabic: {
      writingDirection: 'rtl',
      fontSize: 16,
      color: colors.text,
      marginBottom: 3,
      fontFamily: 'System',
    },
    surahAyahs: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    surahHeader: {
      backgroundColor: colors.header,
      padding: 20,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    surahHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    surahHeaderInfo: {
      flex: 1,
      marginStart: 15,
    },
    surahHeaderName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    surahHeaderArabic: {
      writingDirection: 'rtl',
      fontSize: 18,
      color: colors.textSecondary,
    },
    headerActionButton: {
      padding: 8,
      marginStart: 10,
    },
    bismillah: {
      backgroundColor: colors.card,
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: 'center',
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    bismillahText: {
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    bismillahTranslation: {
      writingDirection: 'ltr',
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    verseCard: {
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
    verseArabicBase: {
      color: colors.text,
      textAlign: 'right',
      marginTop: 10,
      marginBottom: 10,
      writingDirection: 'rtl',
    },
    verseTranslation: {
      writingDirection: translationId?.startsWith('ur.') || translationId?.startsWith('ar.') ? 'rtl' : 'ltr',
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 10,
      lineHeight: 24,
      textAlign: translationId?.startsWith('ur.') || translationId?.startsWith('ar.') ? 'right' : 'left',
    },
    translationName: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 6,
      fontStyle: 'italic',
      opacity: 0.7,
      textAlign: 'left',
    },
    verseNumberContainer: {
      width: 35,
      height: 35,
      borderRadius: 17.5,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verseNumber: {
      color: colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 15,
    },
    paginationButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      marginHorizontal: 5,
      borderRadius: 8,
      backgroundColor: colors.card,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }),
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    pageInfo: {
      color: colors.textSecondary,
      fontSize: 14,
      marginHorizontal: 10,
    },
    loadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      gap: 8,
    },
    loadButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (selectedSurah) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View style={[dynamicStyles.surahHeader, { backgroundColor: colors.cardSecondary }]}>
            <View style={dynamicStyles.surahHeaderLeft}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSurah(null);
                  setSearchQuery('');
                }}
                style={styles.backButton}
              >
                <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={dynamicStyles.surahHeaderInfo}>
                <Text style={dynamicStyles.surahHeaderName}>{selectedSurah.name}</Text>
                <Text style={dynamicStyles.surahHeaderArabic}>{selectedSurah.nameArabic}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={dynamicStyles.headerActionButton}
              onPress={() => setShowSettingsDrawer(true)}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={dynamicStyles.searchInput}
              placeholder={tr("quran.searchVerses")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {loadingVerses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{tr("quran.loadingVerses")}</Text>
            </View>
          ) : verses.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="cloud-download-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.loadingText, { color: colors.text, marginTop: 20, fontSize: 18 }]}>{tr("quran.versesNotLoaded")}</Text>
              <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 }]}>{tr("quran.tapTheButtonBelowToLoadVersesFrom")}</Text>
              <TouchableOpacity
                style={[dynamicStyles.loadButton, { backgroundColor: colors.text, marginTop: 20 }]}
                onPress={() => setReload(v => v + 1)}
              >
                <Ionicons name="refresh" size={20} color={colors.background} />
                <Text style={[dynamicStyles.loadButtonText, { color: colors.background }]}>{tr("quran.loadVerses")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                ref={listRef}
                key={selectedSurah.number + ':' + currentPage}
                initialNumToRender={VERSES_PER_PAGE}
                onContentSizeChange={() => {
                  const number = pendingBookmark.current;
                  const index = paginatedVerses.findIndex(v => v.number === number);
                  if (index >= 0) listRef.current?.scrollToIndex({index, animated: false});
                }}
                onScrollToIndexFailed={({averageItemLength, index}) =>
                  listRef.current?.scrollToOffset({offset: averageItemLength * index, animated: false})}
                onScrollBeginDrag={() => { pendingBookmark.current = null; }}
                data={paginatedVerses}
                renderItem={renderVerse}
                keyExtractor={(item) => `${selectedSurah.number}_${item.number}`}
                contentContainerStyle={styles.versesList}
                ListHeaderComponent={
                  <>
                    {result?.missingTranslation && <TouchableOpacity onPress={() => setReload(v => v + 1)}>
                      <Text style={{color: colors.textSecondary}}>{tr('quran.translationUnavailableRetry')}</Text>
                    </TouchableOpacity>}
                    {reciterId && (
                      <>
                        {recitationLanguageLabel && (
                          <Text style={[dynamicStyles.audioRecitationLabel, { color: colors.textSecondary }]}>
                            {recitationLanguageLabel}
                          </Text>
                        )}
                        <AudioPlayer
                          surahNumber={selectedSurah.number}
                          reciterId={reciterId}
                        />
                      </>
                    )}
                    <View style={dynamicStyles.bismillah}>
                      <Text style={[
                        dynamicStyles.bismillahText,
                        {
                          fontSize: fontSize + 2, // Slightly larger for Bismillah
                          fontFamily: getFontFamily(arabicFont),
                        }
                      ]}>
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </Text>
                      {locale === 'en' && <Text style={dynamicStyles.bismillahTranslation}>
                        In the name of Allah, the Most Gracious, the Most Merciful
                      </Text>}
                    </View>
                  </>
                }
                ListFooterComponent={
                  totalPages > 1 ? (
                    <View style={dynamicStyles.paginationContainer}>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.paginationButton,
                          currentPage === 1 && dynamicStyles.paginationButtonDisabled,
                        ]}
                        onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <Text style={dynamicStyles.paginationText}>{tr("quran.previous")}</Text>
                      </TouchableOpacity>
                      <Text style={dynamicStyles.pageInfo}>{tr("quran.pageValueOfValue", { value1: currentPage, value2: totalPages })}</Text>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.paginationButton,
                          currentPage === totalPages && dynamicStyles.paginationButtonDisabled,
                        ]}
                        onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <Text style={dynamicStyles.paginationText}>{tr("quran.next")}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  searchQuery.trim() ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyText, { color: colors.text }]}>{tr("quran.noVersesFound")}</Text>
                    </View>
                  ) : null
                }
              />
            </>
          )}
        </View>

        <QuranSettingsDrawer
          visible={showSettingsDrawer}
          onClose={() => {
            setShowSettingsDrawer(false);
          }}
          onSettingsChange={async (settings) => {
            if (settings.font !== undefined) setArabicFont(settings.font);
            if (settings.fontSize !== undefined) setFontSize(settings.fontSize);
            if (settings.translation !== undefined) {
              const newTranslationId = settings.translation;
              setTranslationId(newTranslationId);
              setShowTranslation(Boolean(newTranslationId));
            }
            if (settings.reciter !== undefined) setReciterId(settings.reciter);
            if (settings.font !== undefined) {
              setArabicFont(settings.font);
            }
            if (settings.fontSize !== undefined) {
              setFontSize(settings.fontSize);
            }
          }}
        />

        <QuranDownloadModal
          visible={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          onDownload={handleDownload}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.headerTitle}>{tr("quran.theHolyQuran")}</Text>
            <Text style={dynamicStyles.headerSubtitle}>{tr("quran.valueSurahs", { value1: SURAHS.length })}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={tr("quran.bookmarksValue", {value1: bookmarks.length})} onPress={() => setShowBookmarks(true)} style={{padding: 8}}>
            <Ionicons name="bookmarks-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettingsDrawer(true)}
            style={{ padding: 8, marginStart: 10 }}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder={tr("quran.searchSurahs")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>{tr("quran.noSurahsFound")}</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{tr("quran.tryADifferentSearchTerm")}</Text>
              </View>
            ) : null
          }
        />
      </View>

      <QuranSettingsDrawer
        visible={showSettingsDrawer}
        onClose={async () => {
          setShowSettingsDrawer(false);
          // Reload settings when drawer closes
          // Changes are applied by onSettingsChange.
        }}
        onSettingsChange={(settings) => {
          if (settings.font) setArabicFont(settings.font);
          if (settings.fontSize) setFontSize(settings.fontSize);
          if (settings.translation !== undefined) {
            setTranslationId(settings.translation);
          }
          if (settings.reciter !== undefined) setReciterId(settings.reciter);
        }}
      />

      <QuranDownloadModal
        visible={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
      />

      {/* Bookmarks Modal */}
      {showBookmarks && (
        <View style={[styles.bookmarksModal, { backgroundColor: colors.surface }]}>
          <View style={[styles.bookmarksHeader, { backgroundColor: colors.cardSecondary, borderBottomColor: colors.borderVisible, borderBottomWidth: 1 }]}>
            <Text style={[styles.bookmarksTitle, { color: colors.text }]}>{tr("quran.bookmarksValue", { value1: bookmarks.length })}</Text>
            <TouchableOpacity onPress={() => setShowBookmarks(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.bookmarkItem, { backgroundColor: colors.card }]}
                onPress={() => {
                  const surah = SURAHS.find((s) => s.number === item.surahNumber);
                  if (surah) {
                    pendingBookmark.current = item.verseNumber;
                    setSearchQuery('');
                    setCurrentPage(1 + Math.floor((item.verseNumber - 1) / VERSES_PER_PAGE));
                    setSelectedSurah(surah);
                    setShowBookmarks(false);
                  }
                }}
              >
                <View style={styles.bookmarkContent}>
                  <Text style={[styles.bookmarkSurah, { color: colors.text }]}>{tr("quran.valueVerseValue", { value1: item.surahName, value2: item.verseNumber })}</Text>
                  <Text
                    style={[styles.bookmarkText, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {item.verseText}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    await removeBookmark(item.surahNumber, item.verseNumber);
                    await loadBookmarks();
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>{tr("quran.noBookmarksYet")}</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{tr("quran.bookmarkVersesWhileReadingToSaveThemHere")}</Text>
              </View>
            }
            contentContainerStyle={styles.bookmarksList}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    marginEnd: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  versesList: {
    padding: 20,
    paddingBottom: 20,
  },
  surahInfo: {
    flex: 1,
  },
  backButton: {
    marginEnd: 15,
    padding: 5,
  },
  surahHeaderInfo: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  downloadButtonText: {
    marginStart: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verseActions: {
    flexDirection: 'row',
  },
  verseActionButton: {
    padding: 8,
    marginStart: 10,
  },
  bookmarksModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  bookmarksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  bookmarksTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  bookmarksList: {
    padding: 20,
  },
  bookmarkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  bookmarkContent: {
    flex: 1,
    marginEnd: 10,
  },
  bookmarkSurah: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  bookmarkText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
