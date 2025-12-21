import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { RECITERS, TRANSLATIONS, getDownloadedSurahs, markSurahDownloaded, saveSurahVerses, isSurahDownloaded, isTranslationDownloaded } from '../utils/quranStorage';
import { SURAHS } from '../data/surahs';

const ARABIC_FONTS = [
  { id: 'system', name: 'System Default' },
  { id: 'uthmani', name: 'Uthmani Script' },
  { id: 'naskh', name: 'Naskh' },
  { id: 'nastaliq', name: 'Nastaliq' },
];

const STORAGE_KEYS = {
  ARABIC_FONT: '@quran_arabic_font',
  FONT_SIZE: '@quran_font_size',
  DOWNLOADED_TRANSLATIONS: '@quran_downloaded_translations',
  DOWNLOADED_AUDIO: '@quran_downloaded_audio',
  SELECTED_TRANSLATION: '@quran_selected_translation',
  SELECTED_RECITER: '@quran_selected_reciter',
};

export default function QuranSettingsDrawer({ visible, onClose, onSettingsChange }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFont, setSelectedFont] = useState('system');
  const [fontSize, setFontSize] = useState(22);
  const [selectedTranslation, setSelectedTranslation] = useState(null);
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [downloadedTranslations, setDownloadedTranslations] = useState([]);
  const [downloadedAudio, setDownloadedAudio] = useState([]);
  const [downloadingArabic, setDownloadingArabic] = useState(false);
  const [downloadedArabic, setDownloadedArabic] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 114 });
  const [pausedArabic, setPausedArabic] = useState(false);
  const [failedSurahs, setFailedSurahs] = useState([]); // Track which surahs failed
  const [downloadingTranslations, setDownloadingTranslations] = useState({}); // { translationId: { current: 0, total: 114 } }
  const [downloadingAudio, setDownloadingAudio] = useState({}); // { reciterId: { current: 0, total: 114 } }
  const [pausedAudio, setPausedAudio] = useState({}); // { reciterId: true/false }
  const [audioDownloadControllers, setAudioDownloadControllers] = useState({}); // { reciterId: AbortController }
  const [showSurahSelector, setShowSurahSelector] = useState(false);
  const [selectedReciterForSurah, setSelectedReciterForSurah] = useState(null);
  const [selectedSurahsForDownload, setSelectedSurahsForDownload] = useState([]);
  const [selectedSurahsForDelete, setSelectedSurahsForDelete] = useState([]);
  const [downloadedSurahsPerReciter, setDownloadedSurahsPerReciter] = useState({}); // { reciterId: [1, 2, 3, ...] }
  const [showDownloadedSurahsList, setShowDownloadedSurahsList] = useState(null); // reciterId or null

  useEffect(() => {
    if (visible) {
      // Load settings asynchronously without blocking
      loadSettings().catch(err => console.log('Settings load error:', err));
      // Load downloaded surahs for each reciter
      loadDownloadedSurahsPerReciter().catch(err => console.log('Error loading downloaded surahs:', err));
    }
  }, [visible]);

  useEffect(() => {
    if (showSurahSelector && selectedReciterForSurah) {
      // Reload downloaded surahs for the specific reciter when the modal opens
      loadDownloadedSurahsPerReciter(selectedReciterForSurah).catch(err => console.log('Error loading downloaded surahs:', err));
    }
  }, [showSurahSelector, selectedReciterForSurah]);

  const loadDownloadedSurahsPerReciter = async (specificReciterId = null) => {
    try {
      const downloadedAud = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_AUDIO);
      const audioList = downloadedAud ? JSON.parse(downloadedAud) : [];
      
      const allReciterIds = RECITERS.map(r => r.id);
      // If a specific reciter is provided, check it; otherwise check all reciters
      const recitersToCheck = specificReciterId 
        ? [specificReciterId]
        : [...new Set([...audioList, ...allReciterIds])]; // Check all reciters, not just those in the list
      
      const surahsPerReciter = {};
      
      for (const reciterId of recitersToCheck) {
        const audioDir = `${FileSystem.documentDirectory}quran_audio/${reciterId}/`;
        const downloadedSurahs = [];
        
        for (const surah of SURAHS) {
          try {
            const fileUri = `${audioDir}${surah.number}.mp3`;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists && fileInfo.size > 0) {
              downloadedSurahs.push(surah.number);
            }
          } catch (error) {
            // Skip if error checking file
          }
        }
        
        // Only add to the list if there are downloaded surahs
        if (downloadedSurahs.length > 0) {
          surahsPerReciter[reciterId] = downloadedSurahs;
        }
      }
      
      // Merge with existing state to preserve other reciters' data
      setDownloadedSurahsPerReciter(prev => ({
        ...prev,
        ...surahsPerReciter
      }));
    } catch (error) {
      console.error('Error loading downloaded surahs per reciter:', error);
    }
  };

  const loadSettings = async () => {
    try {
      // Load all settings in parallel for better performance
      const [
        font,
        size,
        translation,
        reciter,
        downloadedTrans,
        downloadedAud,
        downloadedSurahs,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ARABIC_FONT),
        AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_TRANSLATION),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_RECITER),
        AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_TRANSLATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_AUDIO),
        getDownloadedSurahs(),
      ]);

      if (font) setSelectedFont(font);
      if (size) setFontSize(parseInt(size, 10));
      if (translation) setSelectedTranslation(translation);
      if (reciter) setSelectedReciter(reciter);
      
      // Check which translations are actually downloaded (have data in storage)
      const actuallyDownloaded = [];
      if (downloadedTrans) {
        try {
          const transList = JSON.parse(downloadedTrans);
          // Verify each translation actually has data
          for (const transId of transList) {
            const isDownloaded = await isTranslationDownloaded(transId);
            // Also check if translation data exists in storage
            const key = `@quran_translation_${transId}`;
            const translationData = await AsyncStorage.getItem(key);
            if (translationData) {
              try {
                const parsed = JSON.parse(translationData);
                // Check if it has data for at least one surah
                if (parsed && Object.keys(parsed).length > 0) {
                  actuallyDownloaded.push(transId);
                }
              } catch (e) {
                // Invalid data, skip
              }
            }
          }
          setDownloadedTranslations(actuallyDownloaded);
        } catch (e) {
          console.log('Error parsing translations:', e);
        }
      }
      
      if (downloadedAud) {
        try {
          setDownloadedAudio(JSON.parse(downloadedAud));
        } catch (e) {
          console.log('Error parsing audio:', e);
        }
      }
      // Check download status
      const currentCount = downloadedSurahs ? downloadedSurahs.length : 0;
      const allDownloaded = currentCount === SURAHS.length;
      console.log(`Arabic Quran download status: ${currentCount}/${SURAHS.length} surahs, allDownloaded=${allDownloaded}`);
      setDownloadedCount(currentCount);
      setDownloadedArabic(allDownloaded);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleFontChange = async (fontId) => {
    setSelectedFont(fontId);
    await AsyncStorage.setItem(STORAGE_KEYS.ARABIC_FONT, fontId);
    if (onSettingsChange) onSettingsChange({ font: fontId });
  };

  const handleFontSizeChange = async (size) => {
    setFontSize(size);
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, size.toString());
    if (onSettingsChange) onSettingsChange({ fontSize: size });
  };

  const handleTranslationToggle = async (translationId, value) => {
    if (value) {
      // Check if translation is actually downloaded offline
      const key = `@quran_translation_${translationId}`;
      const translationData = await AsyncStorage.getItem(key);
      const isActuallyDownloaded = translationData ? (() => {
        try {
          const parsed = JSON.parse(translationData);
          return parsed && Object.keys(parsed).length > 0;
        } catch {
          return false;
        }
      })() : false;

      // Set as selected translation
      setSelectedTranslation(translationId);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_TRANSLATION, translationId);

      // Immediately trigger reload of verses to show translation
      if (onSettingsChange) {
        onSettingsChange({ 
          translation: translationId, 
          downloadTranslation: isActuallyDownloaded,
          useOffline: isActuallyDownloaded,
          reloadVerses: true // Signal to reload verses immediately
        });
      }
    } else {
      // Turn off - deselect translation
      if (translationId === selectedTranslation) {
        setSelectedTranslation(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_TRANSLATION);
      }

      // Immediately trigger reload of verses to remove translation
      if (onSettingsChange) {
        onSettingsChange({ 
          translation: null, 
          downloadTranslation: false,
          reloadVerses: true // Signal to reload verses immediately
        });
      }
    }
  };

  const fetchTranslationFromAPI = async (surahNumber, translationId) => {
    // Map translation IDs to different API formats
    const translationResourceMap = {
      'en.sahih': { alquran: 'en.sahih', qurancom: '131', github: 'eng-muhammadtaqiudd' },
      'en.pickthall': { alquran: 'en.pickthall', qurancom: '19', github: 'eng-marmadukepickth' },
      'en.yusufali': { alquran: 'en.yusufali', qurancom: '20', github: 'eng-yusufaliorig' },
      'en.ahmedali': { alquran: 'en.ahmedali', qurancom: '163', github: 'eng-ahmedali' },
      'en.khattab': { alquran: 'en.khattab', qurancom: null, github: 'eng-mustafakhattaba' },
      'ur.maududi': { alquran: 'ur.maududi', qurancom: '95', github: 'urd-abulaalamaududi' },
      'fr.hamidullah': { alquran: 'fr.hamidullah', qurancom: '50', github: 'fra-muhammadhamidul' },
      'es.borneo': { alquran: 'es.borneo', qurancom: '142', github: 'spa-raulgonzalezbor' },
    };

    const resources = translationResourceMap[translationId] || { alquran: translationId, qurancom: null, github: translationId };
    
    // Use GitHub CDN first (most reliable)
    const apiEndpoints = [
      {
        url: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${resources.github}/${surahNumber}.json`,
        format: 'github',
      },
      {
        url: `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/${resources.github}/${surahNumber}.json`,
        format: 'github',
      },
      {
        url: `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/${resources.alquran}`,
        format: 'alquran',
      },
    ];
    
    if (resources.qurancom) {
      apiEndpoints.push({
        url: `https://api.quran.com/api/v4/quran/translations/${resources.qurancom}?chapter_number=${surahNumber}`,
        format: 'qurancom',
      });
    }

    let lastError = null;
    
    for (let i = 0; i < apiEndpoints.length; i++) {
      try {
        const { url, format } = apiEndpoints[i];
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }

        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '' || responseText.trim() === 'undefined') {
          lastError = new Error('Empty response from API');
          continue;
        }

        let data = JSON.parse(responseText);
        
        // Handle GitHub API format - { chapter: [{ chapter, verse, text }, ...] }
        if (format === 'github') {
          let versesArray = null;
          
          // Format 1: { chapter: [...] } - most common GitHub API format
          if (data.chapter && Array.isArray(data.chapter) && data.chapter.length > 0) {
            versesArray = data.chapter;
          }
          // Format 2: Direct array
          else if (Array.isArray(data) && data.length > 0) {
            versesArray = data;
          }
          // Format 3: { verses: [...] }
          else if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
            versesArray = data.verses;
          }
          
          if (versesArray && versesArray.length > 0) {
            return versesArray.map((verse, index) => {
              const num = verse.verse || verse.verse_number || verse.number || (index + 1);
              const text = verse.text || '';
              return {
                number: typeof num === 'string' ? parseInt(num, 10) : num,
                text: text.trim(),
              };
            }).filter(v => v.text && v.text.length > 0);
          }
        }
        // Handle Al-Quran Cloud format
        else if (format === 'alquran' && data.code === 200 && data.data) {
          if (data.data.ayahs && Array.isArray(data.data.ayahs) && data.data.ayahs.length > 0) {
            return data.data.ayahs.map((ayah, index) => ({
              number: ayah.numberInSurah || ayah.number || (index + 1),
              text: (ayah.text || '').trim(),
            })).filter(v => v.text && v.text.length > 0);
          }
        }
        // Handle quran.com API format
        else if (format === 'qurancom' && data.translations && Array.isArray(data.translations) && data.translations.length > 0) {
          return data.translations.map((trans, index) => ({
            number: trans.verse_number || trans.verseNumber || (index + 1),
            text: (trans.text || trans.translated_text || '').trim(),
          })).filter(v => v.text && v.text.length > 0);
        }
      } catch (apiError) {
        if (apiError.name === 'AbortError') {
          lastError = new Error('Request timed out');
        } else {
          lastError = apiError;
        }
        if (i === apiEndpoints.length - 1) {
          break;
        }
      }
    }

    throw lastError || new Error('All API endpoints failed');
  };

  const downloadTranslation = async (translationId) => {
    if (downloadingTranslations[translationId]) {
      return; // Already downloading
    }

    setDownloadingTranslations(prev => ({ ...prev, [translationId]: { current: 0, total: SURAHS.length } }));

    Alert.alert(
      'Download Translation',
      `This will download ${TRANSLATIONS.find(t => t.id === translationId)?.name || translationId} for all 114 surahs. This may take some time.`,
      [
        { text: 'Cancel', onPress: () => {
          setDownloadingTranslations(prev => {
            const updated = { ...prev };
            delete updated[translationId];
            return updated;
          });
        }},
        {
          text: 'Download',
          onPress: async () => {
            try {
              const translationData = {};
              let successCount = 0;
              let failCount = 0;

              for (let i = 0; i < SURAHS.length; i++) {
                const surah = SURAHS[i];
                setDownloadingTranslations(prev => ({
                  ...prev,
                  [translationId]: { current: i + 1, total: SURAHS.length }
                }));

                try {
                  const verses = await fetchTranslationFromAPI(surah.number, translationId);
                  translationData[surah.number] = verses;
                  successCount++;
                  
                  // Small delay to avoid overwhelming the API
                  if (i < SURAHS.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                  }
                } catch (error) {
                  console.error(`Failed to download translation for surah ${surah.number}:`, error);
                  failCount++;
                }
              }

              // Save translation data to AsyncStorage only after all surahs are processed
              if (successCount > 0) {
                const key = `@quran_translation_${translationId}`;
                await AsyncStorage.setItem(key, JSON.stringify(translationData));
                
                // Mark as downloaded
                const updated = [...downloadedTranslations];
                if (!updated.includes(translationId)) {
                  updated.push(translationId);
                  setDownloadedTranslations(updated);
                  await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_TRANSLATIONS, JSON.stringify(updated));
                }
              }

              // Clear downloading state before showing alert
              setDownloadingTranslations(prev => {
                const updated = { ...prev };
                delete updated[translationId];
                return updated;
              });

              // Show success/error alert only once at the end
              if (successCount === SURAHS.length && failCount === 0) {
                Alert.alert('Success', `Translation downloaded successfully for all ${successCount} surahs!`);
              } else if (successCount > 0) {
                Alert.alert(
                  'Partial Success',
                  `Downloaded ${successCount} out of ${SURAHS.length} surahs. ${failCount} failed.`
                );
              } else {
                Alert.alert('Error', 'Failed to download translation. Please check your internet connection and try again.');
              }
            } catch (error) {
              console.error('Download error:', error);
              Alert.alert('Error', 'Failed to download translation. Please check your internet connection.');
              setDownloadingTranslations(prev => {
                const updated = { ...prev };
                delete updated[translationId];
                return updated;
              });
            }
          },
        },
      ]
    );
  };

  const handleReciterToggle = async (reciterId, value) => {
    // value is true for select, false for deselect
    if (value) {
      // Select reciter
      setSelectedReciter(reciterId);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_RECITER, reciterId);
    } else {
      // Deselect reciter
      if (reciterId === selectedReciter) {
        setSelectedReciter(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_RECITER);
      }
    }

    if (onSettingsChange) onSettingsChange({ reciter: value ? reciterId : null });
  };

  const pauseAudioDownload = (reciterId) => {
    setPausedAudio(prev => ({ ...prev, [reciterId]: true }));
  };

  const cancelAudioDownload = (reciterId) => {
    Alert.alert(
      'Cancel Download',
      'Are you sure you want to cancel this download? Progress will be lost.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Clear download state
            setDownloadingAudio(prev => {
              const updated = { ...prev };
              delete updated[reciterId];
              return updated;
            });
            setPausedAudio(prev => {
              const updated = { ...prev };
              delete updated[reciterId];
              return updated;
            });
            Alert.alert('Download Cancelled', 'The download has been cancelled.');
          },
        },
      ]
    );
  };

  const handleDeleteAudio = async (reciterId) => {
    const reciterName = RECITERS.find(r => r.id === reciterId)?.name || reciterId;
    Alert.alert(
      'Delete Audio Recitation',
      `Choose what to delete for ${reciterName}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Whole Quran',
          style: 'destructive',
          onPress: async () => {
            await deleteAudioFiles(reciterId, null);
          },
        },
        {
          text: 'Select Specific Surahs',
          onPress: () => {
            // Open surah selector for deletion
            setSelectedReciterForSurah(reciterId);
            setSelectedSurahsForDownload([]);
            setSelectedSurahsForDelete([]);
            setShowSurahSelector(true);
          },
        },
      ]
    );
  };

  const deleteAudioFiles = async (reciterId, selectedSurahNumbers = null) => {
    try {
      const reciterName = RECITERS.find(r => r.id === reciterId)?.name || reciterId;
      console.log(`Starting deletion of audio for ${reciterId}...`);
      
      const audioDir = `${FileSystem.documentDirectory}quran_audio/${reciterId}/`;
      let deletedCount = 0;
      
      if (selectedSurahNumbers && selectedSurahNumbers.length > 0) {
        // Delete only selected surahs
        for (const surahNum of selectedSurahNumbers) {
          try {
            const fileUri = `${audioDir}${surahNum}.mp3`;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              deletedCount++;
            }
          } catch (error) {
            console.error(`Error deleting surah ${surahNum}:`, error);
          }
        }
        
        // Check if any files remain - if not, remove from downloaded list
        let hasRemainingFiles = false;
        for (const surah of SURAHS) {
          const checkUri = `${audioDir}${surah.number}.mp3`;
          const checkInfo = await FileSystem.getInfoAsync(checkUri);
          if (checkInfo.exists) {
            hasRemainingFiles = true;
            break;
          }
        }
        
        if (!hasRemainingFiles) {
          const downloadedAud = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_AUDIO);
          if (downloadedAud) {
            try {
              const audioList = JSON.parse(downloadedAud);
              const updated = audioList.filter(id => id !== reciterId);
              await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_AUDIO, JSON.stringify(updated));
              setDownloadedAudio(updated);
            } catch (e) {
              console.log('Error parsing audio list:', e);
            }
          }
        }
        
        Alert.alert('Success', `Deleted ${deletedCount} surah(s) for ${reciterName}.`);
      } else {
        // Delete all audio files
        const downloadedAud = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_AUDIO);
        if (downloadedAud) {
          try {
            const audioList = JSON.parse(downloadedAud);
            const updated = audioList.filter(id => id !== reciterId);
            await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_AUDIO, JSON.stringify(updated));
            setDownloadedAudio(updated);
            console.log('Removed from downloaded audio list');
          } catch (e) {
            console.log('Error parsing audio list:', e);
          }
        }
        
        // Delete all audio files for this reciter
        try {
          const dirInfo = await FileSystem.getInfoAsync(audioDir);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(audioDir, { idempotent: true });
            console.log(`Deleted audio directory: ${audioDir}`);
            deletedCount = SURAHS.length;
          }
        } catch (error) {
          console.error('Error deleting audio directory:', error);
          // Try deleting individual files if directory deletion fails
          for (const surah of SURAHS) {
            try {
              const fileUri = `${audioDir}${surah.number}.mp3`;
              const fileInfo = await FileSystem.getInfoAsync(fileUri);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                deletedCount++;
              }
            } catch (fileError) {
              console.error(`Error deleting file for surah ${surah.number}:`, fileError);
            }
          }
        }
        
        Alert.alert('Success', `All audio files for ${reciterName} have been deleted successfully.`);
      }
      
      // Clear download state if downloading
      setDownloadingAudio(prev => {
        const updated = { ...prev };
        delete updated[reciterId];
        return updated;
      });
      setPausedAudio(prev => {
        const updated = { ...prev };
        delete updated[reciterId];
        return updated;
      });
      
      // Reload downloaded surahs list after deletion
      await loadDownloadedSurahsPerReciter(reciterId);
    } catch (error) {
      console.error('Error deleting audio:', error);
      Alert.alert('Error', `Failed to delete audio recitation: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleDownloadSelected = () => {
    if (!selectedReciterForSurah || selectedSurahsForDownload.length === 0) {
      Alert.alert('No Selection', 'Please select at least one surah to download.');
      return;
    }

    // Start download for selected surahs
    const totalSurahs = selectedSurahsForDownload.length;
    setDownloadingAudio(prev => ({ ...prev, [selectedReciterForSurah]: { current: 0, total: totalSurahs } }));
    setPausedAudio(prev => ({ ...prev, [selectedReciterForSurah]: false }));
    setShowSurahSelector(false);
    
    startAudioDownload(selectedReciterForSurah, false, selectedSurahsForDownload).catch(error => {
      console.error('Download error:', error);
    });

    // Reset state
    setSelectedReciterForSurah(null);
    setSelectedSurahsForDownload([]);
    setSelectedSurahsForDelete([]);
  };

  const handleDeleteSelected = async () => {
    if (!selectedReciterForSurah || selectedSurahsForDelete.length === 0) {
      Alert.alert('No Selection', 'Please select at least one surah to delete.');
      return;
    }

    // Delete selected surahs
    setShowSurahSelector(false);
    await deleteAudioFiles(selectedReciterForSurah, selectedSurahsForDelete);
    
    // Reload downloaded surahs list after deletion
    await loadDownloadedSurahsPerReciter(selectedReciterForSurah);

    // Reset state
    setSelectedReciterForSurah(null);
    setSelectedSurahsForDownload([]);
    setSelectedSurahsForDelete([]);
  };

  const toggleSurahSelection = (surahNumber, isDownloaded) => {
    if (isDownloaded) {
      // Toggle in delete list
      setSelectedSurahsForDelete(prev => {
        if (prev.includes(surahNumber)) {
          return prev.filter(n => n !== surahNumber);
        } else {
          return [...prev, surahNumber];
        }
      });
    } else {
      // Toggle in download list
      setSelectedSurahsForDownload(prev => {
        if (prev.includes(surahNumber)) {
          return prev.filter(n => n !== surahNumber);
        } else {
          return [...prev, surahNumber];
        }
      });
    }
  };

  const resumeAudioDownload = async (reciterId) => {
    setPausedAudio(prev => ({ ...prev, [reciterId]: false }));
    // Resume download by calling downloadAudioRecitation again
    // It will check for existing files and continue from where it left off
    await downloadAudioRecitation(reciterId, true);
  };

  const downloadAudioRecitation = async (reciterId, isResume = false, selectedSurahNumbers = null) => {
    if (downloadingAudio[reciterId] && !isResume && !pausedAudio[reciterId]) {
      return; // Already downloading and not paused
    }

    // If resuming, don't show alert, just continue
    if (isResume) {
      setPausedAudio(prev => ({ ...prev, [reciterId]: false }));
      // Continue with download logic below
      await startAudioDownload(reciterId, true, selectedSurahNumbers);
      return;
    }

    // Show options: Whole Quran or Select Surahs
    Alert.alert(
      'Download Audio Recitation',
      `Choose what to download for ${RECITERS.find(r => r.id === reciterId)?.name || reciterId}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Whole Quran (114 surahs)',
          onPress: () => {
            // Set downloading state immediately
            const totalSurahs = SURAHS.length;
            setDownloadingAudio(prev => ({ ...prev, [reciterId]: { current: 0, total: totalSurahs } }));
            setPausedAudio(prev => ({ ...prev, [reciterId]: false }));
            // Start download for all surahs
            startAudioDownload(reciterId, false, null).catch(error => {
              console.error('Download error:', error);
            });
          },
        },
        {
          text: 'Select Specific Surahs',
          onPress: () => {
            // Open surah selector
            setSelectedReciterForSurah(reciterId);
            setSelectedSurahsForDownload([]);
            setSelectedSurahsForDelete([]);
            setShowSurahSelector(true);
          },
        },
      ]
    );
  };

  const startAudioDownload = async (reciterId, isResume = false, selectedSurahNumbers = null) => {
    try {
      const audioDir = `${FileSystem.documentDirectory}quran_audio/${reciterId}/`;
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
        console.log(`Created audio directory: ${audioDir}`);
      } else {
        console.log(`Audio directory already exists: ${audioDir}`);
      }

      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Determine which surahs to download
      let surahsToDownload = SURAHS;
      if (selectedSurahNumbers && selectedSurahNumbers.length > 0) {
        // Download only selected surahs
        surahsToDownload = SURAHS.filter(s => selectedSurahNumbers.includes(s.number));
      } else if (isResume) {
        // Resume: find how many files already exist and continue from there
        let startIndex = 0;
        for (let j = 0; j < SURAHS.length; j++) {
          const checkSurah = SURAHS[j];
          const checkFileUri = `${audioDir}${checkSurah.number}.mp3`;
          const checkFileInfo = await FileSystem.getInfoAsync(checkFileUri);
          if (checkFileInfo.exists && checkFileInfo.size > 0) {
            startIndex = j + 1;
          } else {
            break;
          }
        }
        surahsToDownload = SURAHS.slice(startIndex);
      }

      const totalToDownload = surahsToDownload.length;
      let currentIndex = 0;

      for (const surah of surahsToDownload) {
        // Check if paused
        if (pausedAudio[reciterId]) {
          console.log(`Download paused for ${reciterId} at surah ${surah.number}`);
          break; // Exit loop but keep download state
        }

        currentIndex++;
        setDownloadingAudio(prev => ({
          ...prev,
          [reciterId]: { current: currentIndex, total: totalToDownload }
        }));

        try {
          let audioUrl;

          if (reciterId === 'arabic_english_r2') {
            // Arabic & English combined recitation – download from your R2 bucket
            const surahNum = surah.number.toString().padStart(3, '0');
            // Try custom domain first, fallback to dev URL if it fails
            const R2_CUSTOM_URL = 'https://cdn.muslimsync.com/quran';
            const R2_DEV_URL = 'https://pub-2c4edd4aaabe4396b691206a23c98516.r2.dev/quran';
            audioUrl = `${R2_CUSTOM_URL}/${surahNum}.mp3`;
          } else {
          // Map reciter IDs to Islamic Network CDN format (same as AudioPlayer)
          const reciterApiMap = {
            'mishary_rashid_alafasy': 'ar.alafasy',
            'abdul_basit_murattal': 'ar.abdulbasitmurattal',
            'abdul_basit_mujawwad': 'ar.abdulbasitmujawwad',
            'abdullah_basfar': 'ar.abdullahbasfar',
            'abdurrahmaan_alsudais': 'ar.abdurrahmaansudais',
            'saad_al_ghamdi': 'ar.saadghamdi',
            'maher_al_muaiqly': 'ar.mahermuaiqly',
            'muhammad_ayyoub': 'ar.muhammadayyoub',
            'abdullah_matroud': 'ar.abdullahmatroud',
            'ahmed_ibn_ali_al_ajamy': 'ar.ahmedibnaliajamy',
          };
          
          const reciterCode = reciterApiMap[reciterId] || reciterApiMap['mishary_rashid_alafasy'];
          // Use Islamic Network CDN (more reliable)
            audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciterCode}/${surah.number}.mp3`;
          }
          const fileUri = `${audioDir}${surah.number}.mp3`;
          
          // Check if file already exists and has valid size
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
            console.log(`Surah ${surah.number} already downloaded (${fileInfo.size} bytes), skipping`);
            successCount++;
            continue;
          }

          // Download audio file with timeout and fallback for R2
          console.log(`Downloading audio for surah ${surah.number} from: ${audioUrl}`);
          
          let downloadResult;
          let downloadedFileInfo;
          
          try {
            // For R2, try custom domain first with shorter timeout (15 seconds)
            if (reciterId === 'arabic_english_r2' && audioUrl.includes('cdn.muslimsync.com')) {
              const quickTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Download timeout')), 15000)
              );
              downloadResult = await Promise.race([FileSystem.downloadAsync(audioUrl, fileUri), quickTimeoutPromise]);
              
              // Verify the file was actually downloaded
              downloadedFileInfo = await FileSystem.getInfoAsync(fileUri);
              
              if (downloadResult.status === 200 && downloadedFileInfo.exists && downloadedFileInfo.size > 0) {
                console.log(`✅ Successfully downloaded surah ${surah.number} from custom domain (${downloadedFileInfo.size} bytes)`);
                successCount++;
                // Continue to next surah
                if (currentIndex < totalToDownload) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
                continue;
              }
              
              // If custom domain failed, try dev URL fallback
              console.log(`❌ Custom domain download failed for surah ${surah.number}, trying dev URL fallback`);
              const surahNum = surah.number.toString().padStart(3, '0');
              const R2_DEV_URL = 'https://pub-2c4edd4aaabe4396b691206a23c98516.r2.dev/quran';
              audioUrl = `${R2_DEV_URL}/${surahNum}.mp3`;
              console.log(`Trying fallback URL: ${audioUrl}`);
              
              // Delete any incomplete file from custom domain attempt
              try {
                const existingFileInfo = await FileSystem.getInfoAsync(fileUri);
                if (existingFileInfo.exists) {
                  await FileSystem.deleteAsync(fileUri, { idempotent: true });
                }
              } catch (deleteError) {
                // Ignore delete errors
              }
            }
            
            // Try download (either first attempt for non-R2, or fallback for R2)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Download timeout')), 60000)
            );
            
            downloadResult = await Promise.race([FileSystem.downloadAsync(audioUrl, fileUri), timeoutPromise]);
            
            // Verify the file was actually downloaded
            downloadedFileInfo = await FileSystem.getInfoAsync(fileUri);
            
            if (downloadResult.status === 200 && downloadedFileInfo.exists && downloadedFileInfo.size > 0) {
              console.log(`Successfully downloaded surah ${surah.number} (${downloadedFileInfo.size} bytes)`);
              successCount++;
            } else {
              console.error(`Download failed for surah ${surah.number}: status=${downloadResult.status}, exists=${downloadedFileInfo.exists}, size=${downloadedFileInfo.size}`);
              // Try to delete the incomplete file
              try {
                if (downloadedFileInfo.exists) {
                  await FileSystem.deleteAsync(fileUri, { idempotent: true });
                }
              } catch (deleteError) {
                console.error('Error deleting incomplete file:', deleteError);
              }
              failCount++;
            }
          } catch (downloadError) {
            // If custom domain failed and we haven't tried fallback yet, try it now
            if (reciterId === 'arabic_english_r2' && audioUrl.includes('cdn.muslimsync.com') && !audioUrl.includes('r2.dev')) {
              console.log(`Custom domain download failed for surah ${surah.number}: ${downloadError.message}, trying dev URL fallback`);
              try {
                const surahNum = surah.number.toString().padStart(3, '0');
                const R2_DEV_URL = 'https://pub-2c4edd4aaabe4396b691206a23c98516.r2.dev/quran';
                audioUrl = `${R2_DEV_URL}/${surahNum}.mp3`;
                
                // Delete any incomplete file
                try {
                  const existingFileInfo = await FileSystem.getInfoAsync(fileUri);
                  if (existingFileInfo.exists) {
                    await FileSystem.deleteAsync(fileUri, { idempotent: true });
                  }
                } catch (deleteError) {
                  // Ignore
                }
                
                // Try with dev URL
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Download timeout')), 60000)
                );
                downloadResult = await Promise.race([FileSystem.downloadAsync(audioUrl, fileUri), timeoutPromise]);
                downloadedFileInfo = await FileSystem.getInfoAsync(fileUri);
                
                if (downloadResult.status === 200 && downloadedFileInfo.exists && downloadedFileInfo.size > 0) {
                  console.log(`✅ Successfully downloaded surah ${surah.number} from dev URL fallback (${downloadedFileInfo.size} bytes)`);
                  successCount++;
                  // Continue to next surah
                  if (currentIndex < totalToDownload) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                  continue;
                } else {
                  throw new Error('Fallback download also failed');
                }
              } catch (fallbackError) {
                console.error(`❌ Both custom domain and dev URL failed for surah ${surah.number}:`, fallbackError.message);
                failCount++;
              }
            } else {
              // For non-R2 or already tried fallback, just count as failure
              console.error(`Download failed for surah ${surah.number}:`, downloadError.message);
              failCount++;
            }
          }
                  
          // Small delay to avoid overwhelming the server
          if (currentIndex < totalToDownload) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          const errorMsg = `Surah ${surah.number}: ${error.message || error}`;
          console.error(`Failed to download audio for surah ${surah.number}:`, errorMsg);
          errors.push(errorMsg);
          // Try to delete the incomplete file
          try {
            const fileUri = `${audioDir}${surah.number}.mp3`;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
          } catch (deleteError) {
            // Ignore delete errors
          }
          failCount++;
        }
      }

              // Mark as downloaded if all succeeded (only for whole Quran)
              if (!selectedSurahNumbers && successCount === SURAHS.length && failCount === 0) {
                const updated = [...downloadedAudio];
                if (!updated.includes(reciterId)) {
                  updated.push(reciterId);
                  setDownloadedAudio(updated);
                  await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_AUDIO, JSON.stringify(updated));
                }
              }
              
              // Reload downloaded surahs list for this reciter
              await loadDownloadedSurahsPerReciter(reciterId);

      // Only clear download state if not paused
      const isPaused = pausedAudio[reciterId];
      if (!isPaused) {
        setDownloadingAudio(prev => {
          const updated = { ...prev };
          delete updated[reciterId];
          return updated;
        });
        setPausedAudio(prev => {
          const updated = { ...prev };
          delete updated[reciterId];
          return updated;
        });

        // Only show alerts if download completed (not paused)
        if (successCount === SURAHS.length && failCount === 0) {
          Alert.alert('Success', `Audio recitation downloaded successfully for all ${successCount} surahs!`);
        } else if (successCount > 0) {
          const errorDetails = errors.length > 0 ? `\n\nFirst few errors:\n${errors.slice(0, 3).join('\n')}` : '';
          Alert.alert(
            'Partial Success',
            `Downloaded ${successCount} out of ${SURAHS.length} surahs. ${failCount} failed.${errorDetails}`
          );
        } else {
          const errorDetails = errors.length > 0 ? `\n\nErrors:\n${errors.slice(0, 5).join('\n')}` : '';
          Alert.alert('Error', `Failed to download audio recitation. Please check your internet connection and try again.${errorDetails}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Failed to download audio recitation: ${error.message || 'Unknown error'}. Please check your internet connection.`);
      setDownloadingAudio(prev => {
        const updated = { ...prev };
        delete updated[reciterId];
        return updated;
      });
      setPausedAudio(prev => {
        const updated = { ...prev };
        delete updated[reciterId];
        return updated;
      });
    }
  };

  const fetchSurahFromAPI = async (surahNumber) => {
    // Try quran.com API first, then fallback to other APIs
    const apiEndpoints = [
      {
        url: `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`,
        format: 'qurancom',
      },
      {
        url: `https://api.alquran.cloud/v1/surah/${surahNumber}`,
        format: 'alquran',
      },
      {
        url: `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani`,
        format: 'alquran',
      },
      {
        url: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmani/${surahNumber}.json`,
        format: 'jsdelivr',
      },
    ];

    let lastError = null;
    
    for (let i = 0; i < apiEndpoints.length; i++) {
      try {
        const { url, format } = apiEndpoints[i];
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }

        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '' || responseText.trim() === 'undefined') {
          lastError = new Error('Empty response from API');
          continue;
        }

        let data = JSON.parse(responseText);
        
        // Handle quran.com API format
        if (format === 'qurancom' && data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
          return data.verses.map((verse, index) => ({
            number: verse.verse_number || (index + 1),
            text: verse.text_uthmani || verse.text || '',
            translation: null,
            audio: null,
          }));
        }
        // Handle Al-Quran Cloud format
        else if (format === 'alquran' && data.code === 200 && data.data) {
          if (data.data.ayahs && Array.isArray(data.data.ayahs) && data.data.ayahs.length > 0) {
            return data.data.ayahs.map((ayah, index) => ({
              number: ayah.numberInSurah || ayah.number || (index + 1),
              text: ayah.text || '',
              translation: null,
              audio: ayah.audio || null,
            }));
          } else if (Array.isArray(data.data) && data.data.length > 0) {
            const surahData = data.data[0];
            if (surahData.ayahs && Array.isArray(surahData.ayahs) && surahData.ayahs.length > 0) {
              return surahData.ayahs.map((ayah, idx) => ({
                number: ayah.numberInSurah || ayah.number || (idx + 1),
                text: ayah.text || '',
                translation: null,
                audio: ayah.audio || null,
              }));
            }
          } else if (data.data.edition && data.data.edition.ayahs && Array.isArray(data.data.edition.ayahs)) {
            return data.data.edition.ayahs.map((ayah, idx) => ({
              number: ayah.numberInSurah || ayah.number || (idx + 1),
              text: ayah.text || '',
              translation: null,
              audio: ayah.audio || null,
            }));
          }
        }
        // Handle jsdelivr format
        else if (format === 'jsdelivr' && Array.isArray(data) && data.length > 0) {
          return data.map((v, idx) => ({
            number: v.number || idx + 1,
            text: v.text || '',
            translation: null,
            audio: null,
          }));
        }
      } catch (apiError) {
        if (apiError.name === 'AbortError') {
          lastError = new Error('Request timed out');
        } else {
          lastError = apiError;
        }
        if (i === apiEndpoints.length - 1) {
          break;
        }
      }
    }

    throw lastError || new Error('All API endpoints failed');
  };

  const downloadEntireQuran = async (initialCount = 0) => {
    // Download surahs sequentially (like translations) - all together, not in batches
    let newlyDownloadedCount = 0; // Count only newly downloaded surahs
    let failCount = 0;
    const totalSurahs = SURAHS.length;
    let completedCount = initialCount; // Track total completed (including skipped)
    const currentFailedSurahs = [...failedSurahs]; // Track failures in this session

    // Process surahs sequentially
    for (let i = 0; i < SURAHS.length; i++) {
      const surah = SURAHS[i];
      
      // Check if paused
      if (pausedArabic) {
        console.log(`Download paused at surah ${surah.number}`);
        break; // Exit loop but keep download state
      }
      
      // Retry failed surahs on resume (don't skip them)
      
      // Update progress
      setDownloadProgress({ current: completedCount, total: totalSurahs });
      
      try {
        // Check if already downloaded
        if (await isSurahDownloaded(surah.number)) {
          completedCount++;
          continue; // Skip already downloaded surahs
        }

        // Fetch from API with timeout
        const verses = await Promise.race([
          fetchSurahFromAPI(surah.number),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000)
          )
        ]);
        
        if (!verses || verses.length === 0) {
          console.error(`No verses returned for surah ${surah.number}`);
          completedCount++;
          failCount++;
          if (!currentFailedSurahs.includes(surah.number)) {
            currentFailedSurahs.push(surah.number);
          }
          // Pause on failure
          setPausedArabic(true);
          setFailedSurahs(currentFailedSurahs);
          Alert.alert(
            'Download Paused',
            `Failed to download surah ${surah.number} (${surah.name}). Download paused. You can resume to continue with remaining surahs.`,
            [{ text: 'OK' }]
          );
          break; // Exit loop
        }
        
        // Save to cache and mark as downloaded
        await saveSurahVerses(surah.number, verses, true);
        console.log(`Surah ${surah.number} saved and marked as downloaded (${verses.length} verses)`);
        
        // Remove from failed list if it was previously failed
        if (currentFailedSurahs.includes(surah.number)) {
          const index = currentFailedSurahs.indexOf(surah.number);
          currentFailedSurahs.splice(index, 1);
          setFailedSurahs(currentFailedSurahs);
        }
        
        newlyDownloadedCount++;
        completedCount++;
        
        // Small delay to avoid overwhelming the API (like translations)
        if (i < SURAHS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Failed to download surah ${surah.number} (${surah.name}):`, error.message || error);
        completedCount++;
        failCount++;
        if (!currentFailedSurahs.includes(surah.number)) {
          currentFailedSurahs.push(surah.number);
        }
        // Pause on failure
        setPausedArabic(true);
        setFailedSurahs(currentFailedSurahs);
        Alert.alert(
          'Download Paused',
          `Failed to download surah ${surah.number} (${surah.name}): ${error.message || 'Unknown error'}. Download paused. You can resume to continue with remaining surahs.`,
          [{ text: 'OK' }]
        );
        break; // Exit loop
      }
    }

    // If not paused, ensure final progress is set correctly
    if (!pausedArabic) {
      setDownloadProgress({ current: totalSurahs, total: totalSurahs });
    }

    // Total success count = initial downloaded + newly downloaded
    const totalSuccessCount = initialCount + newlyDownloadedCount;
    return { successCount: totalSuccessCount, failCount, totalSurahs, paused: pausedArabic };
  };

  const handleDeleteArabic = async () => {
    Alert.alert(
      'Delete Arabic Quran',
      'Are you sure you want to delete all downloaded Arabic Quran surahs? This will free up storage space but you will need to download again for offline access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting deletion of Arabic Quran...');
              
              // Clear all downloaded surahs from storage
              const downloadedSurahsKey = '@quran_downloaded_surahs';
              await AsyncStorage.removeItem(downloadedSurahsKey);
              console.log('Cleared downloaded surahs list');
              
              // Clear all surah verse data
              let deletedCount = 0;
              let errorCount = 0;
              
              for (const surah of SURAHS) {
                try {
                  const key = `@quran_surah_${surah.number}`;
                  const exists = await AsyncStorage.getItem(key);
                  if (exists) {
                    await AsyncStorage.removeItem(key);
                    deletedCount++;
                  }
                } catch (error) {
                  console.error(`Error deleting surah ${surah.number}:`, error);
                  errorCount++;
                }
              }
              
              console.log(`Deleted ${deletedCount} surahs, ${errorCount} errors`);
              
              // Update state
              setDownloadedArabic(false);
              setDownloadedCount(0);
              setDownloadProgress({ current: 0, total: 114 });
              
              // Reload settings to ensure UI is updated
              await loadSettings();
              
              Alert.alert('Success', `Arabic Quran has been deleted successfully. ${deletedCount} surahs removed.`);
            } catch (error) {
              console.error('Error deleting Arabic Quran:', error);
              Alert.alert('Error', `Failed to delete Arabic Quran: ${error.message || 'Unknown error'}. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const resumeArabicDownload = async () => {
    setPausedArabic(false);
    // Resume download by calling handleDownloadArabic again
    await handleDownloadArabic(true);
  };

  const handleDownloadArabic = async (isResume = false) => {
    if (downloadedArabic) {
      Alert.alert('Info', 'Arabic Quran is already downloaded');
      return;
    }

    // If resuming, don't show alert, just continue
    if (isResume) {
      setPausedArabic(false);
      setDownloadingArabic(true);
      setDownloadProgress({ current: downloadedCount, total: SURAHS.length });
      // Continue with download logic below
    } else {
      // Reset pause state and clear failed surahs for fresh download
      setPausedArabic(false);
      setFailedSurahs([]);
      
      const remainingCount = SURAHS.length - downloadedCount;
      const actionText = downloadedCount > 0 ? 'Resume Download' : 'Download';
      const message = downloadedCount > 0 
        ? `You have ${downloadedCount} surahs downloaded. This will download the remaining ${remainingCount} surahs from quran.com API. This may take a few minutes. Make sure you have a stable internet connection.`
        : 'This will download the entire Quran (114 surahs) from quran.com API for offline reading. This may take a few minutes. Make sure you have a stable internet connection.';

      setDownloadingArabic(true);
      setDownloadProgress({ current: downloadedCount, total: SURAHS.length });
      
      Alert.alert(
        `${actionText} Arabic Quran`,
        message,
        [
          { text: 'Cancel', onPress: () => setDownloadingArabic(false) },
          {
            text: actionText,
            onPress: async () => {
              await startDownload();
            },
          },
        ]
      );
      return;
    }

    // Continue with download if resuming
    await startDownload();

    async function startDownload() {
      try {
        const { successCount, failCount, totalSurahs, paused } = await downloadEntireQuran(downloadedCount);
        
        // Only update progress if not paused
        if (!paused) {
          setDownloadProgress({ current: totalSurahs, total: totalSurahs });
        }
        
        // Wait a moment for all async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload settings to check if all surahs are actually downloaded
        await loadSettings();
        
        // Double-check the state after reload
        const finalCheck = await getDownloadedSurahs();
        console.log(`Final check: ${finalCheck.length} surahs marked as downloaded`);
        
        // Only show alerts if download completed (not paused)
        if (!paused) {
          if (failCount === 0 && successCount === totalSurahs) {
            Alert.alert('Success', `All ${successCount} surahs downloaded successfully! The entire Quran is now available offline.`);
            setFailedSurahs([]); // Clear failed surahs on success
          } else if (successCount > 0) {
            Alert.alert(
              'Partial Success',
              `Downloaded ${successCount} out of ${totalSurahs} surahs. ${failCount} failed. You can resume to continue with remaining surahs.`
            );
          }
        }
      } catch (error) {
        console.error('Download error:', error);
        if (!pausedArabic) {
          Alert.alert('Error', 'Failed to download Arabic Quran. Please check your internet connection and try again.');
        }
      } finally {
        // Only clear downloading state if not paused
        if (!pausedArabic) {
          setDownloadingArabic(false);
        }
      }
    }
  };

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
      width: '85%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      flex: 0,
    },
    drawerContent: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Math.max(insets.top, 20), // Use safe area inset or minimum 20
      borderBottomWidth: 1,
      borderBottomColor: colors.borderVisible,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderVisible,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    optionLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    fontOption: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    fontOptionSelected: {
      backgroundColor: colors.text,
    },
    fontOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    fontOptionTextSelected: {
      color: colors.surface,
    },
    sliderContainer: {
      paddingVertical: 10,
    },
    sliderValue: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginTop: 10,
    },
    translationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderVisible,
    },
    translationInfo: {
      flex: 1,
    },
    translationName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    translationSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView
          style={dynamicStyles.drawer}
          edges={['right', 'bottom', 'left']}
        >
          <View style={dynamicStyles.drawerContent}>
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.headerTitle}>Quran Settings</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
            {/* Arabic Quran */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Download</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  style={[dynamicStyles.fontOption, downloadedArabic && { opacity: 0.6 }, { flex: 1 }]}
                  onPress={handleDownloadArabic}
                  disabled={downloadingArabic || downloadedArabic}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={downloadedArabic ? 'checkmark-circle' : downloadingArabic ? 'hourglass-outline' : 'download-outline'}
                      size={20}
                      color={downloadedArabic ? colors.text : colors.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={dynamicStyles.fontOptionText}>
                        {downloadingArabic 
                          ? `Downloading... (${downloadProgress.current}/${downloadProgress.total})`
                          : downloadedArabic 
                          ? 'Arabic Quran Downloaded (114/114)' 
                          : downloadedCount > 0
                          ? `Resume Download (${downloadedCount}/114 downloaded)`
                          : 'Arabic Quran'}
                      </Text>
                      {downloadingArabic && (
                        <>
                          <Text style={[dynamicStyles.translationSubtext, { marginTop: 4 }]}>
                            {pausedArabic ? 'Paused' : 'Downloading...'} ({downloadProgress.current}/{downloadProgress.total})
                          </Text>
                          <Text style={[dynamicStyles.translationSubtext, { marginTop: 2 }]}>
                            {Math.round((downloadProgress.current / downloadProgress.total) * 100)}% complete
                          </Text>
                          {failedSurahs.length > 0 && (
                            <Text style={[dynamicStyles.translationSubtext, { marginTop: 2, color: colors.textSecondary }]}>
                              {failedSurahs.length} surah(s) failed - tap Resume to retry
                            </Text>
                          )}
                        </>
                      )}
                      {!downloadingArabic && downloadedArabic && (
                        <Text style={[dynamicStyles.translationSubtext, { marginTop: 4 }]}>
                          All 114 surahs available offline
                        </Text>
                      )}
                      {!downloadingArabic && !downloadedArabic && downloadedCount > 0 && (
                        <Text style={[dynamicStyles.translationSubtext, { marginTop: 4 }]}>
                          {downloadedCount} surahs already downloaded, {SURAHS.length - downloadedCount} remaining
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                {downloadingArabic && pausedArabic && (
                  <TouchableOpacity
                    onPress={resumeArabicDownload}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: colors.text,
                    }}
                  >
                    <Ionicons
                      name="play"
                      size={20}
                      color={colors.surface}
                    />
                  </TouchableOpacity>
                )}
                {downloadedArabic && !downloadingArabic && (
                  <TouchableOpacity
                    onPress={handleDeleteArabic}
                    style={{ marginLeft: 10, padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Arabic Font Selection */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Arabic Font</Text>
              {ARABIC_FONTS.map((font) => (
                <TouchableOpacity
                  key={font.id}
                  style={[
                    dynamicStyles.fontOption,
                    selectedFont === font.id && dynamicStyles.fontOptionSelected,
                  ]}
                  onPress={() => handleFontChange(font.id)}
                >
                  <Text
                    style={[
                      dynamicStyles.fontOptionText,
                      selectedFont === font.id && dynamicStyles.fontOptionTextSelected,
                    ]}
                  >
                    {font.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Font Size */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Font Size</Text>
              <View style={dynamicStyles.sliderContainer}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={16}
                  maximumValue={32}
                  step={1}
                  value={fontSize}
                  onValueChange={handleFontSizeChange}
                  minimumTrackTintColor={colors.text}
                  maximumTrackTintColor={colors.textSecondary}
                  thumbTintColor={colors.text}
                />
                <Text style={dynamicStyles.sliderValue}>{fontSize}px</Text>
              </View>
            </View>

            {/* Translations */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Translations</Text>
              {TRANSLATIONS.map((translation) => {
                const isDownloaded = downloadedTranslations.includes(translation.id);
                const isSelected = selectedTranslation === translation.id;
                const isDownloading = !!downloadingTranslations[translation.id];
                const downloadProgress = downloadingTranslations[translation.id] || null;
                return (
                  <View key={translation.id} style={dynamicStyles.translationRow}>
                    <View style={dynamicStyles.translationInfo}>
                      <Text style={dynamicStyles.translationName}>{translation.name}</Text>
                      {isSelected && (
                        <Text style={dynamicStyles.translationSubtext}>
                          {isDownloaded ? 'Selected (offline available)' : 'Selected (will load from API)'}
                        </Text>
                      )}
                      {isDownloading && downloadProgress && (
                        <Text style={dynamicStyles.translationSubtext}>
                          Downloading... ({downloadProgress.current}/{downloadProgress.total})
                        </Text>
                      )}
                      {isDownloaded && !isDownloading && !isSelected && (
                        <Text style={dynamicStyles.translationSubtext}>Downloaded for offline</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Switch
                        value={isSelected}
                        onValueChange={(value) => handleTranslationToggle(translation.id, value)}
                        trackColor={{ false: colors.textSecondary, true: colors.text }}
                        thumbColor={isSelected ? colors.surface : colors.textSecondary}
                        disabled={isDownloading}
                      />
                      <TouchableOpacity
                        onPress={() => downloadTranslation(translation.id)}
                        disabled={isDownloading || isDownloaded}
                        style={[
                          {
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: isDownloaded ? colors.card : colors.text,
                            opacity: (isDownloading || isDownloaded) ? 0.5 : 1,
                          }
                        ]}
                      >
                        <Ionicons
                          name={isDownloaded ? 'checkmark-circle' : isDownloading ? 'hourglass-outline' : 'download-outline'}
                          size={20}
                          color={isDownloaded ? colors.text : colors.surface}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Arabic Recitations */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Arabic Recitations</Text>
              {RECITERS.filter(r => r.id !== 'arabic_english_r2').map((reciter) => {
                const isDownloaded = downloadedAudio.includes(reciter.id);
                const isSelected = selectedReciter === reciter.id;
                const isDownloading = !!downloadingAudio[reciter.id];
                const isPaused = !!pausedAudio[reciter.id];
                const downloadProgress = downloadingAudio[reciter.id] || null;
                const downloadedSurahs = downloadedSurahsPerReciter[reciter.id] || [];
                const downloadedCount = downloadedSurahs.length;
                const isBilingual = reciter.id === 'arabic_english_r2';
                
                return (
                  <View key={reciter.id} style={dynamicStyles.translationRow}>
                    <View style={dynamicStyles.translationInfo}>
                      <Text style={dynamicStyles.translationName}>{reciter.name}</Text>
                      {isSelected && (
                        <Text style={dynamicStyles.translationSubtext}>Currently selected</Text>
                      )}
                      {isBilingual && !isDownloading && (
                        <Text style={dynamicStyles.translationSubtext}>
                          Streams Arabic & English recitation from your Cloudflare R2 bucket (no per-device download)
                        </Text>
                      )}
                      {isDownloading && downloadProgress && !isBilingual && (
                        <Text style={dynamicStyles.translationSubtext}>
                          {isPaused ? 'Paused' : 'Downloading...'} ({downloadProgress.current}/{downloadProgress.total})
                        </Text>
                      )}
                      {!isBilingual && !isDownloading && downloadedCount > 0 && (
                        <TouchableOpacity
                          onPress={() => setShowDownloadedSurahsList(showDownloadedSurahsList === reciter.id ? null : reciter.id)}
                          style={{ marginTop: 4 }}
                        >
                          <Text style={[dynamicStyles.translationSubtext, { color: colors.text }]}>
                            {downloadedCount === SURAHS.length 
                              ? 'All 114 surahs downloaded' 
                              : `${downloadedCount} surah(s) downloaded - Tap to view`}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!isBilingual && !isDownloading && downloadedCount === 0 && !isSelected && (
                        <Text style={dynamicStyles.translationSubtext}>Not downloaded</Text>
                      )}
                      {showDownloadedSurahsList === reciter.id && downloadedSurahs.length > 0 && !isBilingual && (
                        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.card, borderRadius: 8 }}>
                          <Text style={[dynamicStyles.translationSubtext, { marginBottom: 8, fontWeight: 'bold' }]}>
                            Downloaded Surahs ({downloadedSurahs.length}):
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {downloadedSurahs.sort((a, b) => a - b).map((surahNum) => {
                              const surah = SURAHS.find(s => s.number === surahNum);
                              return (
                                <View
                                  key={surahNum}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    backgroundColor: colors.iconBackground,
                                    borderRadius: 6,
                                    marginRight: 6,
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text style={{ fontSize: 12, color: colors.text }}>
                                    {surahNum}. {surah?.name || surahNum}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Switch
                        value={isSelected}
                        onValueChange={(value) => handleReciterToggle(reciter.id, value)}
                        trackColor={{ false: colors.textSecondary, true: colors.text }}
                        thumbColor={isSelected ? colors.surface : colors.textSecondary}
                        disabled={isDownloading}
                      />
                      {isDownloading && !isBilingual && (
                        <>
                          <TouchableOpacity
                            onPress={() => isPaused ? resumeAudioDownload(reciter.id) : pauseAudioDownload(reciter.id)}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: colors.text,
                            }}
                          >
                            <Ionicons
                              name={isPaused ? 'play' : 'pause'}
                              size={20}
                              color={colors.surface}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => cancelAudioDownload(reciter.id)}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: colors.textSecondary,
                            }}
                          >
                            <Ionicons
                              name="close"
                              size={20}
                              color={colors.surface}
                            />
                          </TouchableOpacity>
                        </>
                      )}
                      {!isDownloading && !isBilingual && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedReciterForSurah(reciter.id);
                            setSelectedSurahsForDownload([]);
                            setSelectedSurahsForDelete([]);
                            setShowSurahSelector(true);
                          }}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: colors.text,
                          }}
                        >
                          <Ionicons
                            name="options-outline"
                            size={20}
                            color={colors.surface}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Arabic & English Recitation */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Arabic & English Recitation</Text>
              {RECITERS.filter(r => r.id === 'arabic_english_r2').map((reciter) => {
                const isDownloaded = downloadedAudio.includes(reciter.id);
                const isSelected = selectedReciter === reciter.id;
                const isDownloading = !!downloadingAudio[reciter.id];
                const isPaused = !!pausedAudio[reciter.id];
                const downloadProgress = downloadingAudio[reciter.id] || null;
                const downloadedSurahs = downloadedSurahsPerReciter[reciter.id] || [];
                const downloadedCount = downloadedSurahs.length;
                
                return (
                  <View key={reciter.id} style={dynamicStyles.translationRow}>
                    <View style={dynamicStyles.translationInfo}>
                      <Text style={dynamicStyles.translationName}>{reciter.name}</Text>
                      {isSelected && (
                        <Text style={dynamicStyles.translationSubtext}>Currently selected</Text>
                      )}
                      {isDownloading && downloadProgress && (
                        <Text style={dynamicStyles.translationSubtext}>
                          {isPaused ? 'Paused' : 'Downloading...'} ({downloadProgress.current}/{downloadProgress.total})
                        </Text>
                      )}
                      {!isDownloading && downloadedCount > 0 && (
                        <TouchableOpacity
                          onPress={() => setShowDownloadedSurahsList(showDownloadedSurahsList === reciter.id ? null : reciter.id)}
                          style={{ marginTop: 4 }}
                        >
                          <Text style={[dynamicStyles.translationSubtext, { color: colors.text }]}>
                            {downloadedCount === SURAHS.length 
                              ? 'All 114 surahs downloaded' 
                              : `${downloadedCount} surah(s) downloaded - Tap to view`}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!isDownloading && downloadedCount === 0 && !isSelected && (
                        <Text style={dynamicStyles.translationSubtext}>Not downloaded</Text>
                      )}
                      {showDownloadedSurahsList === reciter.id && downloadedSurahs.length > 0 && (
                        <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.card, borderRadius: 8 }}>
                          <Text style={[dynamicStyles.translationSubtext, { marginBottom: 8, fontWeight: 'bold' }]}>
                            Downloaded Surahs ({downloadedSurahs.length}):
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {downloadedSurahs.sort((a, b) => a - b).map((surahNum) => {
                              const surah = SURAHS.find(s => s.number === surahNum);
                              return (
                                <View
                                  key={surahNum}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    backgroundColor: colors.iconBackground,
                                    borderRadius: 6,
                                    marginRight: 6,
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text style={{ fontSize: 12, color: colors.text }}>
                                    {surahNum}. {surah?.name || surahNum}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Switch
                        value={isSelected}
                        onValueChange={(value) => handleReciterToggle(reciter.id, value)}
                        trackColor={{ false: colors.textSecondary, true: colors.text }}
                        thumbColor={isSelected ? colors.surface : colors.textSecondary}
                        disabled={isDownloading}
                      />
                      {isDownloading && (
                        <>
                          <TouchableOpacity
                            onPress={() => isPaused ? resumeAudioDownload(reciter.id) : pauseAudioDownload(reciter.id)}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: colors.text,
                            }}
                          >
                            <Ionicons
                              name={isPaused ? 'play' : 'pause'}
                              size={20}
                              color={colors.surface}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => cancelAudioDownload(reciter.id)}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: colors.textSecondary,
                            }}
                          >
                            <Ionicons
                              name="close"
                              size={20}
                              color={colors.surface}
                            />
                          </TouchableOpacity>
                        </>
                      )}
                      {!isDownloading && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedReciterForSurah(reciter.id);
                            setSelectedSurahsForDownload([]);
                            setSelectedSurahsForDelete([]);
                            setShowSurahSelector(true);
                          }}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: colors.text,
                          }}
                        >
                          <Ionicons
                            name="options-outline"
                            size={20}
                            color={colors.surface}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      {/* Surah Selection Modal */}
      <Modal
        visible={showSurahSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowSurahSelector(false);
          setSelectedReciterForSurah(null);
          setSelectedSurahsForDownload([]);
          setSelectedSurahsForDelete([]);
        }}
      >
        <View style={dynamicStyles.overlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              setShowSurahSelector(false);
              setSelectedReciterForSurah(null);
              setSelectedSurahsForDownload([]);
              setSelectedSurahsForDelete([]);
            }}
          />
          <SafeAreaView
            style={dynamicStyles.drawer}
            edges={['right', 'bottom', 'left']}
          >
            <View style={dynamicStyles.drawerContent}>
              <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.headerTitle}>
                  {selectedReciterForSurah 
                    ? `${RECITERS.find(r => r.id === selectedReciterForSurah)?.name || 'Reciter'} - Manage Surahs`
                    : 'Manage Surahs'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowSurahSelector(false);
                  setSelectedReciterForSurah(null);
                  setSelectedSurahsForDownload([]);
                  setSelectedSurahsForDelete([]);
                }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
              >
                {selectedReciterForSurah && (() => {
                  const downloadedSurahs = downloadedSurahsPerReciter[selectedReciterForSurah] || [];
                  const totalSelected = selectedSurahsForDownload.length + selectedSurahsForDelete.length;
                  const allDownloadedSelected = selectedSurahsForDelete.length === downloadedSurahs.length && downloadedSurahs.length > 0;
                  const allNotDownloadedSelected = selectedSurahsForDownload.length === (SURAHS.length - downloadedSurahs.length) && (SURAHS.length - downloadedSurahs.length) > 0;
                  
                  return (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.borderVisible }}>
                        <View style={{ flexDirection: 'row', gap: 15, flex: 1, flexWrap: 'wrap' }}>
                          <TouchableOpacity
                            onPress={() => {
                              if (allNotDownloadedSelected) {
                                setSelectedSurahsForDownload([]);
                              } else {
                                const notDownloaded = SURAHS.filter(s => !downloadedSurahs.includes(s.number)).map(s => s.number);
                                setSelectedSurahsForDownload(notDownloaded);
                              }
                            }}
                            style={{ padding: 8 }}
                          >
                            <Text style={{ color: colors.text, fontSize: 14 }}>
                              {allNotDownloadedSelected ? 'Deselect All (Download)' : 'Select All (Download)'}
                            </Text>
                          </TouchableOpacity>
                          {downloadedSurahs.length > 0 && (
                            <TouchableOpacity
                              onPress={() => {
                                if (allDownloadedSelected) {
                                  setSelectedSurahsForDelete([]);
                                } else {
                                  setSelectedSurahsForDelete([...downloadedSurahs]);
                                }
                              }}
                              style={{ padding: 8 }}
                            >
                              <Text style={{ color: colors.text, fontSize: 14 }}>
                                {allDownloadedSelected ? 'Deselect All (Delete)' : 'Select All (Delete)'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 10, flexShrink: 0 }}>
                          {totalSelected} selected
                        </Text>
                      </View>

                      {SURAHS.map((surah) => {
                        const isDownloaded = downloadedSurahs.includes(surah.number);
                        const isSelectedForDownload = selectedSurahsForDownload.includes(surah.number);
                        const isSelectedForDelete = selectedSurahsForDelete.includes(surah.number);
                        const isSelected = isSelectedForDownload || isSelectedForDelete;
                        
                        return (
                          <TouchableOpacity
                            key={surah.number}
                            onPress={() => toggleSurahSelection(surah.number, isDownloaded)}
                            style={[
                              dynamicStyles.fontOption,
                              isSelected && dynamicStyles.fontOptionSelected,
                              { marginVertical: 4 }
                            ]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[
                                    dynamicStyles.fontOptionText,
                                    isSelected && dynamicStyles.fontOptionTextSelected
                                  ]}>
                                    {surah.number}. {surah.name} ({surah.nameArabic})
                                  </Text>
                                  <Text style={[dynamicStyles.translationSubtext, { marginTop: 2 }]}>
                                    {surah.ayahs} verses {isDownloaded ? '• Downloaded' : '• Not downloaded'}
                                  </Text>
                                </View>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {isDownloaded && (
                                  <Ionicons 
                                    name="checkmark-circle" 
                                    size={24} 
                                    color="#4CAF50" 
                                  />
                                )}
                                {isSelected && (
                                  <Ionicons 
                                    name={isSelectedForDelete ? "trash" : "checkmark-circle"} 
                                    size={24} 
                                    color={isSelectedForDelete ? colors.textSecondary : colors.text} 
                                  />
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  );
                })()}
              </ScrollView>

              <View style={{ padding: 15, borderTopWidth: 1, borderTopColor: colors.borderVisible, gap: 10 }}>
                <TouchableOpacity
                  onPress={handleDownloadSelected}
                  disabled={selectedSurahsForDownload.length === 0}
                  style={[
                    {
                      backgroundColor: colors.text,
                      padding: 15,
                      borderRadius: 10,
                      alignItems: 'center',
                      opacity: selectedSurahsForDownload.length === 0 ? 0.5 : 1,
                    }
                  ]}
                >
                  <Text style={{ color: colors.surface, fontSize: 16, fontWeight: 'bold' }}>
                    Download {selectedSurahsForDownload.length} Surah(s)
                  </Text>
                </TouchableOpacity>
                
                {selectedSurahsForDelete.length > 0 && (
                  <TouchableOpacity
                    onPress={handleDeleteSelected}
                    style={{
                      backgroundColor: colors.textSecondary,
                      padding: 15,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.surface, fontSize: 16, fontWeight: 'bold' }}>
                      Delete {selectedSurahsForDelete.length} Surah(s)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </Modal>
  );
}

