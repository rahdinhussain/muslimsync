import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentLocale, tr } from '../i18n';
import quranSources from '../i18n/quran-sources.cjs';
const { translationStorageKey } = quranSources;
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEYS = {
  DOWNLOADED_SURAHS: '@quran_downloaded_surahs',
  SELECTED_RECITER: '@quran_selected_reciter',
  SELECTED_TRANSLATION: '@quran_selected_translation',
  BOOKMARKS: '@quran_bookmarks',
  DOWNLOADED_AUDIO: '@quran_downloaded_audio',
  DOWNLOADED_TRANSLATIONS: '@quran_downloaded_translations',
};

// Available Reciters
export const RECITERS = [
  { id: 'mishary_rashid_alafasy', name: 'Mishary Rashid Alafasy' },
  // Streams from your Cloudflare R2 bucket (Arabic + English combined audio)
  { id: 'arabic_english_r2', name: 'Arabic & English Recitation' },
];


// Personal names remain as published; descriptive UI labels follow app language.
export const getReciterName = (reciterOrId) => {
  const reciter = typeof reciterOrId === 'string' ? RECITERS.find(({ id }) => id === reciterOrId) : reciterOrId;
  if (!reciter) return tr('quran.reciter', { ns: 'common' });
  return reciter.id === 'arabic_english_r2' ? tr('quranSettingsDrawer.arabicEnglishRecitation') : reciter.name;
};

// Available Translations
export const TRANSLATIONS = [
  { id: 'en.sahih', name: 'Sahih International (English)' },
  { id: 'en.yusufali', name: 'Yusuf Ali (English)' },
  { id: 'en.khattab', name: 'Clear Quran by Mustafa Khattab — Allah Edition (English)' },
  { id: 'en.pickthall', name: 'Pickthall (English)' },
  { id: 'en.ahmedali', name: 'Ahmed Ali (English)' },
  { id: 'bn.bengali', name: 'মুহিউদ্দীন খান (বাংলা)' },
  { id: 'bn.hoque', name: 'জহুরুল হক (বাংলা)' },
  { id: 'ur.maududi', name: 'Maududi (Urdu)' },
  { id: 'fr.hamidullah', name: 'Hamidullah (French)' },
  { id: 'es.borneo', name: 'Borneo (Spanish)' },
];

// Check if surah is downloaded
export const isSurahDownloaded = async (surahNumber) => {
  try {
    const downloaded = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SURAHS);
    const surahs = downloaded ? JSON.parse(downloaded) : [];
    return surahs.includes(surahNumber);
  } catch (error) {
    return false;
  }
};

// Mark surah as downloaded
export const markSurahDownloaded = async (surahNumber) => {
  try {
    const downloaded = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SURAHS);
    const surahs = downloaded ? JSON.parse(downloaded) : [];
    if (!surahs.includes(surahNumber)) {
      surahs.push(surahNumber);
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SURAHS, JSON.stringify(surahs));
    }
  } catch (error) {
    console.error('Error marking surah as downloaded:', error);
  }
};

// Get downloaded surahs
export const getDownloadedSurahs = async () => {
  try {
    const downloaded = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SURAHS);
    return downloaded ? JSON.parse(downloaded) : [];
  } catch (error) {
    return [];
  }
};

// Save surah verses to storage
export const saveSurahVerses = async (surahNumber, verses, markAsDownloaded = false) => {
  try {
    const key = `@quran_surah_${surahNumber}`;
    await AsyncStorage.setItem(key, JSON.stringify(verses));
    // Only mark as downloaded if explicitly requested (e.g., from download button)
    if (markAsDownloaded) {
      await markSurahDownloaded(surahNumber);
    }
  } catch (error) {
    console.error('Error saving surah verses:', error);
  }
};

// Get surah verses from storage
export const getSurahVerses = async (surahNumber) => {
  try {
    const key = `@quran_surah_${surahNumber}`;
    const verses = await AsyncStorage.getItem(key);
    if (!verses) return null;
    
    // Validate that it's valid JSON
    const parsed = JSON.parse(verses);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error parsing cached verses:', error);
    // If cache is corrupted, clear it
    try {
      const key = `@quran_surah_${surahNumber}`;
      await AsyncStorage.removeItem(key);
    } catch (clearError) {
      console.error('Error clearing corrupted cache:', clearError);
    }
    return null;
  }
};

// Save selected reciter
export const saveSelectedReciter = async (reciterId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_RECITER, reciterId);
  } catch (error) {
    console.error('Error saving reciter:', error);
  }
};

// Get selected reciter
export const getSelectedReciter = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_RECITER);
  } catch (error) {
    return null;
  }
};

// Save selected translation
export const saveSelectedTranslation = async (translationId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_TRANSLATION, translationId);
  } catch (error) {
    console.error('Error saving translation:', error);
  }
};

// Get selected translation
export const getSelectedTranslation = async (preferredLocale = currentLocale()) => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_TRANSLATION);
    if (existing) return existing;
    const initializedKey = '@quran_translation_initialized_v1';
    if (await AsyncStorage.getItem(initializedKey)) return null;
    const suggested = { en: 'en.sahih', bn: 'bn.bengali', ur: 'ur.maududi' }[preferredLocale] || null;
    if (suggested) await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_TRANSLATION, suggested);
    await AsyncStorage.setItem(initializedKey, 'true');
    return suggested;
  } catch (error) {
    return null;
  }
};

// Save bookmarks
export const saveBookmarks = async (bookmarks) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Error saving bookmarks:', error);
  }
};

// Get bookmarks
export const getBookmarks = async () => {
  try {
    const bookmarks = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    return [];
  }
};

// Add bookmark
export const addBookmark = async (bookmark) => {
  try {
    const bookmarks = await getBookmarks();
    const exists = bookmarks.find(
      (b) => b.surahNumber === bookmark.surahNumber && b.verseNumber === bookmark.verseNumber
    );
    if (!exists) {
      bookmarks.push({
        ...bookmark,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
      await saveBookmarks(bookmarks);
    }
  } catch (error) {
    console.error('Error adding bookmark:', error);
  }
};

// Remove bookmark
export const removeBookmark = async (surahNumber, verseNumber) => {
  try {
    const bookmarks = await getBookmarks();
    const filtered = bookmarks.filter(
      (b) => !(b.surahNumber === surahNumber && b.verseNumber === verseNumber)
    );
    await saveBookmarks(filtered);
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
};

// Check if verse is bookmarked
export const isBookmarked = async (surahNumber, verseNumber) => {
  try {
    const bookmarks = await getBookmarks();
    return bookmarks.some(
      (b) => b.surahNumber === surahNumber && b.verseNumber === verseNumber
    );
  } catch (error) {
    return false;
  }
};

// Get downloaded translation data for a surah
export const getSurahTranslation = async (surahNumber, translationId) => {
  try {
    const key = translationStorageKey(translationId);
    const translationData = await AsyncStorage.getItem(key);
    if (!translationData) return null;
    
    const parsed = JSON.parse(translationData);
    return parsed[surahNumber] || null;
  } catch (error) {
    console.error('Error getting translation:', error);
    return null;
  }
};

// Check if translation is downloaded
export const isTranslationDownloaded = async (translationId) => {
  try {
    const downloaded = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_TRANSLATIONS);
    const translations = downloaded ? JSON.parse(downloaded) : [];
    if (!translations.includes(translationId)) return false;
    const data = await AsyncStorage.getItem(translationStorageKey(translationId));
    return Boolean(data && Object.keys(JSON.parse(data)).length);
  } catch (error) {
    return false;
  }
};



