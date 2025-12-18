import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from '../utils/quranStorage';

import { SURAHS } from '../data/surahs';
import { getFontFamily } from '../utils/fontLoader';

const VERSES_PER_PAGE = 20; // Pagination

export default function QuranScreen() {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
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
      loadSettings().catch(err => console.log('Settings load error:', err)),
      loadBookmarks().catch(err => console.log('Bookmarks load error:', err))
    ]);
  }, []);

  // Reload settings when drawer closes
  useEffect(() => {
    if (selectedSurah) {
      loadSurahVerses();
      setCurrentPage(1);
    }
  }, [selectedSurah]);

  // Reload verses when translation changes
  useEffect(() => {
    if (selectedSurah && translationId) {
      console.log('Translation ID changed, reloading verses:', translationId);
      // Reload verses to apply new translation
      loadSurahVerses();
    }
  }, [translationId]);

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
      console.log('Error loading font settings:', error);
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
        setRecitationLanguageLabel(`Arabic & English recitation – ${reciter.name}`);
      } else {
        setRecitationLanguageLabel(`Arabic recitation – ${reciter.name}`);
      }
      return;
    }
    setRecitationLanguageLabel(null);
  }, [reciterId]);

  useEffect(() => {
    // Load settings and bookmarks asynchronously without blocking
    Promise.all([
      loadSettings().catch(err => console.log('Settings load error:', err)),
      loadBookmarks().catch(err => console.log('Bookmarks load error:', err))
    ]);
  }, []);

  // Reload settings when drawer closes
  useEffect(() => {
    if (!showSettingsDrawer) {
      loadSettings();
    }
  }, [showSettingsDrawer]);

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

  const loadSurahVerses = async () => {
    if (!selectedSurah) return;

    setLoadingVerses(true);
    try {
      // Always check cache first - if downloaded, use cache
      const isDownloaded = await isSurahDownloaded(selectedSurah.number);
      
      if (isDownloaded) {
        // Load from storage (downloaded file)
        try {
          let surahData = await getSurahVerses(selectedSurah.number);
          // Validate cached data
          if (surahData && Array.isArray(surahData) && surahData.length > 0) {
            // If translation is selected, check if it's downloaded for THIS surah and merge it
            if (translationId) {
              const downloadedTranslation = await getSurahTranslation(selectedSurah.number, translationId);
              if (downloadedTranslation) {
                // Translation is downloaded for this surah - use offline version
                console.log('Using downloaded translation for surah', selectedSurah.number);
                surahData = surahData.map(verse => {
                  const translationVerse = downloadedTranslation.find(t => t.number === verse.number);
                  return {
                    ...verse,
                    translation: translationVerse ? translationVerse.text : verse.translation,
                  };
                });
              } else {
                // Translation is selected but NOT downloaded for this surah - fetch only this surah from API
                console.log('Translation selected but not downloaded, fetching for surah', selectedSurah.number);
                try {
                  // Map translation IDs to GitHub API folder names
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
                    `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${resources.github}/${selectedSurah.number}.json`,
                    `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/${resources.github}/${selectedSurah.number}.json`,
                    `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/${resources.alquran}`,
                  ];
                  
                  if (resources.qurancom) {
                    apiEndpoints.push(`https://api.quran.com/api/v4/quran/translations/${resources.qurancom}?chapter_number=${selectedSurah.number}`);
                  }

                  for (const url of apiEndpoints) {
                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 10000);
                      
                      const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json',
                        },
                        signal: controller.signal,
                      });

                      clearTimeout(timeoutId);

                      if (response.ok) {
                        const responseText = await response.text();
                        if (responseText && responseText.trim() !== '' && responseText.trim() !== 'undefined') {
                          try {
                            const transData = JSON.parse(responseText);
                            
                            let apiTranslation = null;
                            
                            // Handle GitHub API format: { chapter: [{ chapter, verse, text }, ...] }
                            if (transData.chapter && Array.isArray(transData.chapter) && transData.chapter.length > 0) {
                              apiTranslation = transData.chapter.map((verse, idx) => {
                                const num = verse.verse || verse.verse_number || verse.number || (idx + 1);
                                return {
                                  number: typeof num === 'string' ? parseInt(num, 10) : num,
                                  text: (verse.text || '').trim(),
                                };
                              }).filter(t => t.text && t.text.length > 0);
                            }
                            // Handle Al-Quran Cloud format
                            else if (transData.code === 200 && transData.data && transData.data.ayahs) {
                              apiTranslation = transData.data.ayahs.map((ayah, idx) => {
                                const num = ayah.numberInSurah || ayah.number || (idx + 1);
                                return {
                                  number: typeof num === 'string' ? parseInt(num, 10) : num,
                                  text: (ayah.text || '').trim(),
                                };
                              }).filter(t => t.text && t.text.length > 0);
                            }
                            // Handle quran.com format
                            else if (transData.translations && Array.isArray(transData.translations)) {
                              apiTranslation = transData.translations.map((trans, idx) => {
                                const num = trans.verse_number || trans.verseNumber || (idx + 1);
                                return {
                                  number: typeof num === 'string' ? parseInt(num, 10) : num,
                                  text: (trans.text || trans.translated_text || '').trim(),
                                };
                              }).filter(t => t.text && t.text.length > 0);
                            }
                            // Handle direct array format
                            else if (Array.isArray(transData) && transData.length > 0) {
                              apiTranslation = transData.map((verse, idx) => {
                                const num = verse.verse || verse.verse_number || verse.number || (idx + 1);
                                return {
                                  number: typeof num === 'string' ? parseInt(num, 10) : num,
                                  text: (verse.text || '').trim(),
                                };
                              }).filter(t => t.text && t.text.length > 0);
                            }

                            if (apiTranslation && apiTranslation.length > 0) {
                              console.log('Translation fetched from API for surah', selectedSurah.number, ':', apiTranslation.length, 'verses');
                              surahData = surahData.map(verse => {
                                // Try multiple matching strategies
                                let translationVerse = apiTranslation.find(t => {
                                  const tNum = typeof t.number === 'string' ? parseInt(t.number, 10) : t.number;
                                  const vNum = typeof verse.number === 'string' ? parseInt(verse.number, 10) : verse.number;
                                  return tNum === vNum;
                                });
                                
                                // If not found, try matching by index
                                if (!translationVerse && apiTranslation[verse.number - 1]) {
                                  translationVerse = apiTranslation[verse.number - 1];
                                }
                                
                                return {
                                  ...verse,
                                  translation: translationVerse && translationVerse.text ? translationVerse.text.trim() : null,
                                };
                              });
                              console.log('Merged translation with verses. Verses with translation:', surahData.filter(v => v.translation && v.translation.trim() !== '').length);
                              break;
                            } else {
                              console.log('API translation is empty or invalid - no valid verses found');
                            }
                          } catch (parseError) {
                            console.log('Failed to parse translation response:', parseError.message);
                            continue;
                          }
                        }
                      }
                    } catch (apiError) {
                      console.log('Translation API error for surah', selectedSurah.number, ':', apiError.message);
                      continue;
                    }
                  }
                } catch (error) {
                  console.log('Failed to fetch translation from API for surah', selectedSurah.number, ':', error);
                }
              }
            }
            
            setVerses(surahData);
            setLoadingVerses(false);
            return; // Use downloaded file, don't fetch from API
          } else {
            // Cache is invalid, mark as not downloaded and fetch from API
            console.log('Invalid cache, fetching from API');
          }
        } catch (cacheError) {
          console.log('Cache read error, fetching from API:', cacheError);
          // If cache is corrupted, fetch from API
        }
      }

      // If not downloaded or cache invalid, fetch from API

      // Fetch from API - try multiple endpoints
      let data = null;
      let surahData = null;
      const surahNum = selectedSurah.number;
      
      // Try multiple API endpoints with different formats - using reliable sources
      const apiEndpoints = [
        {
          url: `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNum}`,
          format: 'qurancom',
        },
        {
          url: `https://api.alquran.cloud/v1/surah/${surahNum}`,
          format: 'alquran',
        },
        {
          url: `https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani`,
          format: 'alquran',
        },
        {
          url: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmani/${surahNum}.json`,
          format: 'jsdelivr',
        },
        {
          url: `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/ara-quranuthmani/${surahNum}.json`,
          format: 'jsdelivr',
        },
      ];

      let lastError = null;
      
      for (let i = 0; i < apiEndpoints.length; i++) {
        try {
          const { url, format } = apiEndpoints[i];
          console.log(`Trying API ${i + 1}: ${format}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
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
            console.log(`API ${i + 1} returned status: ${response.status}`);
            lastError = new Error(`HTTP ${response.status}`);
            continue;
          }

          // Get response as text first to debug
          const responseText = await response.text();
          
          if (!responseText || responseText.trim() === '' || responseText.trim() === 'undefined') {
            console.log(`API ${i + 1} returned empty response`);
            lastError = new Error('Empty response from API');
            continue;
          }

            // Try to parse JSON
          try {
            data = JSON.parse(responseText);
            
            // Handle quran.com API format
            if (format === 'qurancom' && data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
              data = {
                code: 200,
                data: {
                  ayahs: data.verses.map((verse, index) => ({
                    numberInSurah: verse.verse_number || (index + 1),
                    text: verse.text_uthmani || verse.text || '',
                    translation: null,
                  })),
                },
              };
              break; // Success!
            }
            // Handle Al-Quran Cloud format - can have different structures
            else if (format === 'alquran' && data.code === 200 && data.data) {
              // Structure 1: data.data.ayahs (standard format)
              if (data.data.ayahs && Array.isArray(data.data.ayahs) && data.data.ayahs.length > 0) {
                const validAyahs = data.data.ayahs.filter(ayah => ayah.text && ayah.text.trim() !== '');
                if (validAyahs.length > 0) {
                  break; // Success!
                }
              }
              // Structure 2: data.data is an array, first element has ayahs
              else if (Array.isArray(data.data) && data.data.length > 0) {
                const surahData = data.data[0];
                if (surahData.ayahs && Array.isArray(surahData.ayahs) && surahData.ayahs.length > 0) {
                  const validAyahs = surahData.ayahs.filter(ayah => ayah.text && ayah.text.trim() !== '');
                  if (validAyahs.length > 0) {
                    // Transform to standard format
                    data = {
                      code: 200,
                      data: {
                        ayahs: surahData.ayahs.map((ayah, idx) => ({
                          numberInSurah: ayah.numberInSurah || ayah.number || (idx + 1),
                          text: ayah.text || '',
                          translation: ayah.translation || null,
                        })),
                      },
                    };
                    break; // Success!
                  }
                }
              }
              // Structure 3: Format with edition wrapper
              else if (data.data.edition && data.data.edition.ayahs && Array.isArray(data.data.edition.ayahs)) {
                const validAyahs = data.data.edition.ayahs.filter(ayah => ayah.text && ayah.text.trim() !== '');
                if (validAyahs.length > 0) {
                  data = {
                    code: 200,
                    data: {
                      ayahs: data.data.edition.ayahs.map((ayah, idx) => ({
                        numberInSurah: ayah.numberInSurah || ayah.number || (idx + 1),
                        text: ayah.text || '',
                        translation: ayah.translation || null,
                      })),
                    },
                  };
                  break; // Success!
                }
              }
            }
            // Handle jsdelivr format (direct array)
            else if (format === 'jsdelivr' && Array.isArray(data) && data.length > 0) {
              data = {
                code: 200,
                data: {
                  ayahs: data.map((v, idx) => ({
                    numberInSurah: v.number || idx + 1,
                    text: v.text || '',
                    translation: null,
                  })),
                },
              };
              break; // Success!
            }
            // Try to extract from any structure (fallback)
            else if (data && typeof data === 'object') {
              // Try different possible structures
              let ayahs = null;
              
              // Structure: data.data is array, first element has ayahs
              if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                const firstItem = data.data[0];
                if (firstItem.ayahs && Array.isArray(firstItem.ayahs)) {
                  ayahs = firstItem.ayahs;
                }
              }
              
              // Structure: data.data.ayahs
              if (!ayahs && data.data && data.data.ayahs && Array.isArray(data.data.ayahs)) {
                ayahs = data.data.ayahs;
              }
              
              // Structure: data.ayahs
              if (!ayahs && data.ayahs && Array.isArray(data.ayahs)) {
                ayahs = data.ayahs;
              }
              
              // Structure: data.verses
              if (!ayahs && data.verses && Array.isArray(data.verses)) {
                ayahs = data.verses;
              }
              
              // Structure: data.data is array of verses
              if (!ayahs && data.data && Array.isArray(data.data) && data.data.length > 0) {
                // Check if first element looks like a verse (has text property)
                if (data.data[0].text) {
                  ayahs = data.data;
                }
              }
              
              // Structure: data is array of verses
              if (!ayahs && Array.isArray(data) && data.length > 0 && data[0].text) {
                ayahs = data;
              }
              
              if (Array.isArray(ayahs) && ayahs.length > 0) {
                // Validate ayahs have text
                const validAyahs = ayahs.filter(ayah => ayah.text && ayah.text.trim() !== '');
                if (validAyahs.length > 0) {
                  data = {
                    code: 200,
                    data: { 
                      ayahs: ayahs.map((ayah, idx) => ({
                        numberInSurah: ayah.numberInSurah || ayah.number || (idx + 1),
                        text: ayah.text || '',
                        translation: ayah.translation || null,
                      }))
                    },
                  };
                  break; // Success!
                }
              }
            }
            
            console.log(`API ${i + 1} invalid structure:`, JSON.stringify(data).substring(0, 200));
            lastError = new Error('Invalid response structure');
          } catch (jsonError) {
            console.log(`API ${i + 1} JSON parse failed:`, jsonError.message);
            console.log(`Response preview:`, responseText.substring(0, 200));
            lastError = jsonError;
            continue;
          }
        } catch (apiError) {
          console.error(`API ${i + 1} (${url}) failed:`, apiError.message);
          if (apiError.name === 'AbortError') {
            lastError = new Error('Request timed out after 10 seconds');
          } else if (apiError.message.includes('Failed to fetch') || apiError.message.includes('Network')) {
            lastError = new Error('Network error - please check your internet connection');
          } else {
            lastError = apiError;
          }
          if (i === apiEndpoints.length - 1) {
            // Last endpoint failed
            break;
          }
        }
      }

      // If all APIs failed, throw the last error with helpful message
      if (!data || !data.code || data.code !== 200) {
        const errorMsg = lastError?.message || 'All API endpoints failed';
        console.error('All API endpoints failed. Last error:', errorMsg);
        console.error('Tried endpoints:', apiEndpoints.map(e => e.url));
        throw new Error(errorMsg);
      }

      if (data && data.code === 200 && data.data && data.data.ayahs && Array.isArray(data.data.ayahs)) {
        // Get downloaded translation if available for THIS surah only
        let downloadedTranslation = null;
        if (translationId) {
          console.log('Translation ID selected:', translationId, 'for surah', selectedSurah.number);
          downloadedTranslation = await getSurahTranslation(selectedSurah.number, translationId);
          console.log('Downloaded translation found for surah', selectedSurah.number, ':', downloadedTranslation ? 'Yes' : 'No');
        }

        // If translation is selected but not downloaded for THIS surah, fetch only THIS surah from API
        if (translationId && !downloadedTranslation) {
          try {
            // Fetch translation from API for THIS surah only
            // Use multiple reliable APIs with different formats
            const apiEndpoints = [];
            
            // Map translation IDs to different API formats
            // GitHub API uses specific folder names - verified from fawazahmed0/quran-api
            const translationMap = {
              'en.sahih': {
                alquran: 'en.sahih',
                qurancom: '131',
                github: 'eng-muhammadtaqiudd', // Sahih International
                tanzil: 'en.sahih'
              },
              'en.pickthall': {
                alquran: 'en.pickthall',
                qurancom: '19',
                github: 'eng-marmadukepickth', // Pickthall
                tanzil: 'en.pickthall'
              },
              'en.yusufali': {
                alquran: 'en.yusufali',
                qurancom: '20',
                github: 'eng-yusufaliorig', // Yusuf Ali
                tanzil: 'en.yusufali'
              },
              'en.ahmedali': {
                alquran: 'en.ahmedali',
                qurancom: '163',
                github: 'eng-ahmedali', // Ahmed Ali
                tanzil: 'en.ahmedali'
              },
              'en.khattab': {
                alquran: 'en.khattab',
                qurancom: null,
                github: 'eng-mustafakhattaba', // Clear Quran by Mustafa Khattab
                tanzil: 'en.khattab'
              },
              'ur.maududi': {
                alquran: 'ur.maududi',
                qurancom: '95',
                github: 'urd-abulaalamaududi', // Maududi Urdu
                tanzil: 'ur.maududi'
              },
              'fr.hamidullah': {
                alquran: 'fr.hamidullah',
                qurancom: '50',
                github: 'fra-muhammadhamidul', // Hamidullah French
                tanzil: 'fr.hamidullah'
              },
              'es.borneo': {
                alquran: 'es.borneo',
                qurancom: '142',
                github: 'spa-raulgonzalezbor', // Borneo Spanish
                tanzil: 'es.borneo'
              },
            };
            
            const resources = translationMap[translationId] || { alquran: translationId, qurancom: null, github: translationId, tanzil: translationId };
            
            // Priority 1: GitHub CDN (most reliable and fast)
            apiEndpoints.push({
              url: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${resources.github}/${selectedSurah.number}.json`,
              format: 'github'
            });
            
            // Priority 2: Raw GitHub
            apiEndpoints.push({
              url: `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/${resources.github}/${selectedSurah.number}.json`,
              format: 'github'
            });
            
            // Priority 3: Al-Quran Cloud
            apiEndpoints.push({
              url: `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/${resources.alquran}`,
              format: 'alquran'
            });
            
            // Priority 4: Quran.com API
            if (resources.qurancom) {
              apiEndpoints.push({
                url: `https://api.quran.com/api/v4/quran/translations/${resources.qurancom}?chapter_number=${selectedSurah.number}`,
                format: 'qurancom'
              });
            }
            
            // Priority 5: Alternative GitHub mirror
            apiEndpoints.push({
              url: `https://unpkg.com/quran-json@1.0.1/json/translations/${resources.github}/${selectedSurah.number}.json`,
              format: 'github'
            });
            
            // Priority 6: Simple JSON API (direct format)
            apiEndpoints.push({
              url: `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/${resources.github}/${selectedSurah.number}.min.json`,
              format: 'github'
            });
            
            // Priority 7: Alternative CDN
            apiEndpoints.push({
              url: `https://cdn.statically.io/gh/fawazahmed0/quran-api/1/editions/${resources.github}/${selectedSurah.number}.json`,
              format: 'github'
            });

            let translationFetched = false;
            let lastError = null;
            
            console.log('Fetching translation for:', translationId, 'Surah:', selectedSurah.number);
            
            for (let i = 0; i < apiEndpoints.length; i++) {
              const { url, format } = apiEndpoints[i];
              console.log(`Trying endpoint ${i + 1}/${apiEndpoints.length}: ${format} - ${url.substring(0, 80)}...`);
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000);
                
                const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                  },
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                  const responseText = await response.text();
                  console.log(`Endpoint ${i + 1} response length:`, responseText ? responseText.length : 0);
                  if (responseText && responseText.trim() !== '' && responseText.trim() !== 'undefined') {
                    try {
                      const transData = JSON.parse(responseText);
                      console.log(`Endpoint ${i + 1} parsed. Type:`, Array.isArray(transData) ? 'Array' : typeof transData, 'Keys:', Object.keys(transData).slice(0, 5));
                      
                      // Handle GitHub/JSON format - actual format: { chapter: [{ chapter, verse, text }, ...] }
                      if (format === 'github') {
                        let versesArray = null;
                        
                        // Format 1: { chapter: [...] } - most common GitHub API format
                        if (transData.chapter && Array.isArray(transData.chapter) && transData.chapter.length > 0) {
                          versesArray = transData.chapter;
                        }
                        // Format 2: Direct array
                        else if (Array.isArray(transData) && transData.length > 0) {
                          versesArray = transData;
                        }
                        // Format 3: { verses: [...] }
                        else if (transData.verses && Array.isArray(transData.verses) && transData.verses.length > 0) {
                          versesArray = transData.verses;
                        }
                        
                        if (versesArray && versesArray.length > 0) {
                          downloadedTranslation = versesArray.map((verse, idx) => {
                            // GitHub API uses 'verse' field for verse number
                            const num = verse.verse || verse.verse_number || verse.verse_id || verse.number || (idx + 1);
                            const text = verse.text || verse.translated_text || verse.translation || '';
                            return {
                              number: typeof num === 'string' ? parseInt(num, 10) : num,
                              text: text.trim(),
                            };
                          }).filter(t => t.text && t.text.length > 0);
                          
                          if (downloadedTranslation.length > 0) {
                            console.log(`✅ Translation fetched from endpoint ${i + 1} (${format}):`, downloadedTranslation.length, 'verses');
                            translationFetched = true;
                            break;
                          } else {
                            console.log(`⚠️ Endpoint ${i + 1} (${format}) returned array but no valid translations after filtering`);
                          }
                        } else {
                          console.log(`⚠️ Endpoint ${i + 1} (${format}) - No verses array found. Keys:`, Object.keys(transData));
                        }
                      }
                      
                      // Handle quran.com API format
                      if (format === 'qurancom' && transData.translations && Array.isArray(transData.translations) && transData.translations.length > 0) {
                        downloadedTranslation = transData.translations.map((trans, idx) => {
                          const num = trans.verse_number || trans.verseNumber || trans.verse_id || (idx + 1);
                          return {
                            number: typeof num === 'string' ? parseInt(num, 10) : num,
                            text: (trans.text || trans.translated_text || '').trim(),
                          };
                        }).filter(t => t.text && t.text.length > 0);
                        
                        if (downloadedTranslation.length > 0) {
                          translationFetched = true;
                          break;
                        }
                      }
                      
                      // Handle Al-Quran Cloud format
                      if (format === 'alquran' && transData.code === 200 && transData.data) {
                        let ayahsArray = null;
                        
                        if (transData.data.ayahs && Array.isArray(transData.data.ayahs)) {
                          ayahsArray = transData.data.ayahs;
                        } else if (Array.isArray(transData.data) && transData.data.length > 0) {
                          if (transData.data[0].ayahs && Array.isArray(transData.data[0].ayahs)) {
                            ayahsArray = transData.data[0].ayahs;
                          } else if (Array.isArray(transData.data[0])) {
                            ayahsArray = transData.data[0];
                          }
                        } else if (transData.data.edition && transData.data.edition.ayahs) {
                          ayahsArray = transData.data.edition.ayahs;
                        }
                        
                        if (ayahsArray && Array.isArray(ayahsArray) && ayahsArray.length > 0) {
                          downloadedTranslation = ayahsArray.map((ayah, idx) => {
                            const num = ayah.numberInSurah || ayah.number || (idx + 1);
                            return {
                              number: typeof num === 'string' ? parseInt(num, 10) : num,
                              text: (ayah.text || '').trim(),
                            };
                          }).filter(t => t.text && t.text.length > 0);
                          
                          if (downloadedTranslation.length > 0) {
                            translationFetched = true;
                            break;
                          }
                        }
                      }
                      
                      // Generic fallback - try to extract any array of translation data
                      if (!translationFetched) {
                        // Try to find any array in the response
                        let foundArray = null;
                        if (transData.chapter && Array.isArray(transData.chapter)) {
                          foundArray = transData.chapter;
                        } else if (Array.isArray(transData)) {
                          foundArray = transData;
                        } else if (transData.data && Array.isArray(transData.data)) {
                          foundArray = transData.data;
                        } else if (transData.translations && Array.isArray(transData.translations)) {
                          foundArray = transData.translations;
                        } else if (transData.verses && Array.isArray(transData.verses)) {
                          foundArray = transData.verses;
                        }
                        
                        if (foundArray && foundArray.length > 0) {
                          downloadedTranslation = foundArray.map((item, idx) => {
                            const num = item.number || item.verse_number || item.verseNumber || item.verse_id || item.numberInSurah || (idx + 1);
                            const text = item.text || item.translated_text || item.translation || '';
                            return {
                              number: typeof num === 'string' ? parseInt(num, 10) : num,
                              text: text.trim(),
                            };
                          }).filter(t => t.text && t.text.length > 0);
                          
                          if (downloadedTranslation.length > 0) {
                            translationFetched = true;
                            break;
                          }
                        }
                      }
                      
                      // If we got here, the response structure is unexpected
                      lastError = `Unexpected response structure from endpoint ${i + 1} (${format}). Keys: ${Object.keys(transData).join(', ')}`;
                      console.log(`❌ Endpoint ${i + 1} (${format}) - Unexpected structure:`, Object.keys(transData));
                    } catch (parseError) {
                      lastError = `JSON parse error from endpoint ${i + 1}: ${parseError.message}`;
                      console.log(`❌ Endpoint ${i + 1} (${format}) - Parse error:`, parseError.message);
                      continue;
                    }
                  } else {
                    lastError = `Empty response from endpoint ${i + 1}`;
                    console.log(`❌ Endpoint ${i + 1} (${format}) - Empty response`);
                  }
                } else {
                  lastError = `HTTP ${response.status} from endpoint ${i + 1}`;
                  console.log(`❌ Endpoint ${i + 1} (${format}) - HTTP ${response.status}`);
                }
              } catch (apiError) {
                if (apiError.name === 'AbortError') {
                  lastError = `Timeout from endpoint ${i + 1}`;
                  console.log(`❌ Endpoint ${i + 1} (${format}) - Timeout`);
                } else {
                  lastError = `Error from endpoint ${i + 1}: ${apiError.message}`;
                  console.log(`❌ Endpoint ${i + 1} (${format}) - Error:`, apiError.message);
                }
                // Try next endpoint
                continue;
              }
            }
            
            console.log('Translation fetch result:', translationFetched ? 'SUCCESS' : 'FAILED', downloadedTranslation ? `(${downloadedTranslation.length} verses)` : '');
            
            if (!translationFetched && translationId && selectedSurah) {
              // Show error to user if translation failed to load
              Alert.alert(
                'Translation Error',
                `Failed to load translation for ${selectedSurah.name || 'this surah'}. ${lastError ? `Error: ${lastError}` : 'Please check your internet connection and try again.'}`,
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            // Continue without translation
          }
        }

        surahData = data.data.ayahs.map((ayah, index) => {
          // Normalize verse number to integer
          const verseNumber = typeof (ayah.numberInSurah || ayah.number || (index + 1)) === 'string' 
            ? parseInt(ayah.numberInSurah || ayah.number || (index + 1), 10)
            : (ayah.numberInSurah || ayah.number || (index + 1));
          
          // Use downloaded translation if available, otherwise use API translation
          let verseTranslation = null;
          if (downloadedTranslation && downloadedTranslation.length > 0) {
            // Try multiple matching strategies
            let translationVerse = downloadedTranslation.find(t => {
              const tNum = typeof t.number === 'string' ? parseInt(t.number, 10) : t.number;
              const vNum = typeof verseNumber === 'string' ? parseInt(verseNumber, 10) : verseNumber;
              return tNum === vNum;
            });
            
            // If not found, try matching by index (some APIs use 0-based or 1-based indexing differently)
            if (!translationVerse && downloadedTranslation[index]) {
              translationVerse = downloadedTranslation[index];
            }
            
            // If still not found, try matching by position (verse number - 1 as index)
            if (!translationVerse && downloadedTranslation[verseNumber - 1]) {
              translationVerse = downloadedTranslation[verseNumber - 1];
            }
            
            verseTranslation = translationVerse && translationVerse.text ? translationVerse.text.trim() : null;
          } else {
            verseTranslation = ayah.translation ? ayah.translation.trim() : null;
          }
          
          return {
            number: verseNumber,
            text: ayah.text || '',
            translation: verseTranslation,
            audio: ayah.audio || null,
          };
        });
        
        // Check how many verses have translations
        let versesWithTranslation = surahData.filter(v => v.translation && v.translation.trim() !== '').length;
        
        // If translation was supposed to be loaded but no verses have it, try alternative matching
        if (translationId && versesWithTranslation === 0 && downloadedTranslation && downloadedTranslation.length > 0) {
          // Try alternative matching - maybe verse numbers are offset
          // Strategy 1: Re-merge with index-based matching as fallback
          surahData = surahData.map((verse, idx) => {
            if (!verse.translation && downloadedTranslation[idx] && downloadedTranslation[idx].text) {
              return {
                ...verse,
                translation: downloadedTranslation[idx].text.trim(),
              };
            }
            return verse;
          });
          
          // Check again after fallback merge
          versesWithTranslation = surahData.filter(v => v.translation && v.translation.trim() !== '').length;
          
          // Strategy 2: If still no matches, try matching by array position (verse number - 1)
          if (versesWithTranslation === 0) {
            surahData = surahData.map((verse) => {
              if (!verse.translation && verse.number > 0) {
                const translationIndex = verse.number - 1;
                if (downloadedTranslation[translationIndex] && downloadedTranslation[translationIndex].text) {
                  return {
                    ...verse,
                    translation: downloadedTranslation[translationIndex].text.trim(),
                  };
                }
              }
              return verse;
            });
            
            versesWithTranslation = surahData.filter(v => v.translation && v.translation.trim() !== '').length;
          }
          
          // Strategy 3: If still no matches, try matching by array index (force match)
          if (versesWithTranslation === 0) {
            // Just match by index - assume arrays are in the same order
            const minLength = Math.min(surahData.length, downloadedTranslation.length);
            surahData = surahData.map((verse, idx) => {
              if (idx < minLength && !verse.translation && downloadedTranslation[idx] && downloadedTranslation[idx].text) {
                return {
                  ...verse,
                  translation: downloadedTranslation[idx].text.trim(),
                };
              }
              return verse;
            });
            
            versesWithTranslation = surahData.filter(v => v.translation && v.translation.trim() !== '').length;
          }
        }
        
        // Final check - if we have translations but they're not showing, force match by index
        if (translationId && versesWithTranslation === 0 && downloadedTranslation && downloadedTranslation.length > 0) {
          const minLength = Math.min(surahData.length, downloadedTranslation.length);
          for (let i = 0; i < minLength; i++) {
            if (downloadedTranslation[i] && downloadedTranslation[i].text && !surahData[i].translation) {
              surahData[i] = {
                ...surahData[i],
                translation: downloadedTranslation[i].text.trim(),
              };
            }
          }
        }

        // Only cache if not already downloaded (to avoid overwriting downloaded content)
        // If user wants to download, they should use the download button in drawer
        const isAlreadyDownloaded = await isSurahDownloaded(selectedSurah.number);
        if (!isAlreadyDownloaded) {
          // Cache for temporary use (not marked as downloaded)
          try {
            await saveSurahVerses(selectedSurah.number, surahData);
            // Don't mark as downloaded - only mark when user explicitly downloads
          } catch (saveError) {
            console.log('Failed to cache verses:', saveError);
            // Continue even if caching fails
          }
        }

        setVerses(surahData);
      } else {
        console.error('Invalid API response structure:', data);
        setVerses([]); // Clear verses so user can retry
        Alert.alert(
          'Connection Issue',
          'Unable to load verses from the API. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error loading verses:', error);
      setVerses([]); // Clear verses so user can retry
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('timeout') || errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (!errorMessage.includes('Empty')) {
        // Don't show alert for empty response errors (they're logged)
        Alert.alert('Error', 'Failed to load verses. Please try again.');
      }
    } finally {
      setLoadingVerses(false);
    }
  };

  const handleDownload = async (reciter, translation) => {
    setReciterId(reciter);
    setTranslationId(translation);
    Alert.alert('Info', 'Settings saved! You can now download surahs for offline use from the surah detail view.');
  };

  const downloadSurah = async () => {
    if (!selectedSurah || !reciterId || !translationId) {
      Alert.alert('Error', 'Please configure download settings first');
      setShowDownloadModal(true);
      return;
    }

    Alert.alert(
      'Download',
      `Download ${selectedSurah.name} for offline use?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              await loadSurahVerses(); // This will cache the verses
              Alert.alert('Success', 'Surah downloaded successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to download surah');
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
      const shareText = `${selectedSurah.name} - Verse ${verse.number}\n\n${verse.text}\n\n${verse.translation || ''}`;
      await Share.share({
        message: shareText,
        title: `${selectedSurah.name} - Verse ${verse.number}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
        setSelectedSurah(item);
        setSearchQuery('');
      }}
    >
      <View style={[dynamicStyles.surahNumber, { backgroundColor: colors.iconBackground }]}>
        <Text style={dynamicStyles.surahNumberText}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={dynamicStyles.surahName}>{item.name}</Text>
        <Text style={dynamicStyles.surahNameArabic}>{item.nameArabic}</Text>
        <Text style={dynamicStyles.surahAyahs}>{item.ayahs} Ayahs</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderVerse = ({ item: verse }) => {
    const bookmarkKey = `${selectedSurah.number}_${verse.number}`;
    const isBooked = verseBookmarks[bookmarkKey];

    return (
      <View style={dynamicStyles.verseCard}>
        <View style={styles.verseHeader}>
          <View style={dynamicStyles.verseNumberContainer}>
            <Text style={dynamicStyles.verseNumber}>{verse.number}</Text>
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
        {showTranslation && verse.translation && verse.translation.trim() !== '' ? (
          <>
            <Text style={dynamicStyles.verseTranslation}>{verse.translation}</Text>
            {translationId && (
              <Text style={dynamicStyles.translationName}>
                {TRANSLATIONS.find(t => t.id === translationId)?.name || translationId}
              </Text>
            )}
          </>
        ) : showTranslation && translationId && !verse.translation ? (
          <Text style={[dynamicStyles.verseTranslation, { fontStyle: 'italic', opacity: 0.7 }]}>
            Translation loading...
          </Text>
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
      marginRight: 15,
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
      marginLeft: 15,
    },
    surahHeaderName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    surahHeaderArabic: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    headerActionButton: {
      padding: 8,
      marginLeft: 10,
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
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 10,
      lineHeight: 24,
      textAlign: 'left',
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
                <Ionicons name="arrow-back" size={24} color={colors.text} />
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
              placeholder="Search verses..."
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
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading verses...
              </Text>
            </View>
          ) : verses.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="cloud-download-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.loadingText, { color: colors.text, marginTop: 20, fontSize: 18 }]}>
                Verses not loaded
              </Text>
              <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 }]}>
                Tap the button below to load verses from the internet
              </Text>
              <TouchableOpacity
                style={[dynamicStyles.loadButton, { backgroundColor: colors.text, marginTop: 20 }]}
                onPress={loadSurahVerses}
              >
                <Ionicons name="refresh" size={20} color={colors.background} />
                <Text style={[dynamicStyles.loadButtonText, { color: colors.background }]}>
                  Load Verses
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={paginatedVerses}
                renderItem={renderVerse}
                keyExtractor={(item) => `${selectedSurah.number}_${item.number}`}
                contentContainerStyle={styles.versesList}
                ListHeaderComponent={
                  <>
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
                      <Text style={dynamicStyles.bismillahTranslation}>
                        In the name of Allah, the Most Gracious, the Most Merciful
                      </Text>
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
                        <Text style={dynamicStyles.paginationText}>Previous</Text>
                      </TouchableOpacity>
                      <Text style={dynamicStyles.pageInfo}>
                        Page {currentPage} of {totalPages}
                      </Text>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.paginationButton,
                          currentPage === totalPages && dynamicStyles.paginationButtonDisabled,
                        ]}
                        onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <Text style={dynamicStyles.paginationText}>Next</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  searchQuery.trim() ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyText, { color: colors.text }]}>
                        No verses found
                      </Text>
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
              const translationChanged = newTranslationId !== translationId;
              setTranslationId(newTranslationId);
              // Set showTranslation to true when translation is selected
              if (newTranslationId) {
                setShowTranslation(true);
              } else {
                setShowTranslation(false);
              }
              // Always reload verses when translation changes (if surah is selected)
              if (selectedSurah && (settings.reloadVerses || translationChanged)) {
                await loadSurahVerses();
              }
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
            <Text style={dynamicStyles.headerTitle}>The Holy Quran</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              {SURAHS.length} Surahs
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSettingsDrawer(true)}
            style={{ padding: 8, marginLeft: 10 }}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search surahs..."
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
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No surahs found
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Try a different search term
                </Text>
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
          await loadSettings();
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
            <Text style={[styles.bookmarksTitle, { color: colors.text }]}>
              Bookmarks ({bookmarks.length})
            </Text>
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
                    setSelectedSurah(surah);
                    setShowBookmarks(false);
                    // Scroll to verse after a delay
                    setTimeout(() => {
                      // This would require refs to scroll to specific verse
                      // For now, just open the surah
                    }, 100);
                  }
                }}
              >
                <View style={styles.bookmarkContent}>
                  <Text style={[styles.bookmarkSurah, { color: colors.text }]}>
                    {item.surahName} - Verse {item.verseNumber}
                  </Text>
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
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No bookmarks yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Bookmark verses while reading to save them here
                </Text>
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
    marginRight: 10,
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
    marginRight: 15,
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
    marginLeft: 8,
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
    marginLeft: 10,
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
    marginRight: 10,
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
