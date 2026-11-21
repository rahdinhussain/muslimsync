import { LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { LocalizedText as Text } from '../components/LocalizedPrimitives';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import {
  fetchDuaCategories,
  getDownloadedDuaTextIds,
  fetchDuasByCategory,
  fetchDuaCountsByCategory,
  saveDownloadedDua,
  isDuaTextDownloaded,
  saveDownloadedDuaAudio,
  isDuaAudioDownloaded,
  getDownloadedDuaText,
  getLocalAudioPath,
  localAudioFileExists,
  getDownloadedDuaAudioList,
} from '../utils/duaStorage';
import { tr, getLanguage } from '../i18n';
import { useAppLocale } from '../context/LocaleContext';


const bundledCategoryIds = {
  "morning": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "evening": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
  "food": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
  "travel": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
  "sleep": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15",
  "rizq": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16",
  "forgiveness": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17",
  "health": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18",
  "protection": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19",
  "guidance": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20"
};
const AUDIO_DIR = `${FileSystem.documentDirectory}dua_audio/`;
const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - 40 - CARD_MARGIN) / 2; // 40 for container padding, CARD_MARGIN for gap between cards



export default function DuaScreen() {
  const { locale, isRTL } = useAppLocale();
  const activeCategory = useRef(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;

const DUA_CATEGORIES = [
  {
    id: 'morning',
    title: tr("dua.morningDuas"),
    icon: 'sunny',
    duas: [
      {
        id: 1,
        title: tr("dua.morningDua"),
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
        transliteration: 'Asbahna wa asbahal mulku lillah',
        translation: 'We have reached the morning and at this very time all sovereignty belongs to Allah',
        reference: 'Sahih Muslim 2723',
        audioUrl: null, // Can be added later with actual audio URLs
      },
      {
        id: 2,
        title: tr("dua.protectionDua"),
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
        transliteration: 'Allahumma bika asbahna',
        translation: 'O Allah, by You we enter the morning',
        reference: 'Sunan Abu Dawud 5068',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'evening',
    title: tr("dua.eveningDuas"),
    icon: 'moon',
    duas: [
      {
        id: 3,
        title: tr("dua.eveningDua"),
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
        transliteration: 'Amsayna wa amsal mulku lillah',
        translation: 'We have reached the evening and at this very time all sovereignty belongs to Allah',
        reference: 'Sahih Muslim 2723',
        audioUrl: null,
      },
      {
        id: 4,
        title: tr("dua.protectionDua"),
        arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا',
        transliteration: 'Allahumma bika amsayna',
        translation: 'O Allah, by You we enter the evening',
        reference: 'Sunan Abu Dawud 5068',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'food',
    title: tr("dua.foodDrink"),
    icon: 'restaurant',
    duas: [
      {
        id: 5,
        title: tr("dua.beforeEating"),
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'In the name of Allah',
        reference: 'Sahih al-Bukhari 5376',
        audioUrl: null,
      },
      {
        id: 6,
        title: tr("dua.afterEating"),
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'Praise be to Allah',
        reference: 'Sahih al-Bukhari 5458',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'travel',
    title: tr("dua.travel"),
    icon: 'airplane',
    duas: [
      {
        id: 7,
        title: tr("dua.travelDua"),
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا',
        transliteration: 'Subhanalladhi sakhkhara lana hadha',
        translation: 'Glory to Him who has brought this under our control',
        reference: 'Sahih al-Bukhari 2992',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'sleep',
    title: tr("dua.sleep"),
    icon: 'bed',
    duas: [
      {
        id: 8,
        title: tr("dua.beforeSleep"),
        arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي',
        transliteration: 'Bismika rabbi wada\'tu janbi',
        translation: 'In Your name, my Lord, I lay down my side',
        reference: 'Sahih al-Bukhari 6320',
        audioUrl: null,
      },
      {
        id: 9,
        title: tr("dua.afterWaking"),
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا',
        transliteration: 'Alhamdulillahil ladhi ahyana',
        translation: 'Praise be to Allah who gave us life',
        reference: 'Sahih al-Bukhari 6314',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'rizq',
    title: tr("dua.duaForRizqSustenance"),
    icon: 'cash',
    duas: [
      {
        id: 10,
        title: tr("dua.duaForSustenance"),
        arabic: 'اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
        transliteration: 'Allahumma akfini bihalalika \'an haramika, wa aghnini bifadhlika \'amman siwaka',
        translation: 'O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You',
        reference: 'Sunan at-Tirmidhi 3563',
        audioUrl: null,
      },
      {
        id: 11,
        title: tr("dua.duaForIncreaseInProvision"),
        arabic: 'اللَّهُمَّ بَارِكْ لِي فِيمَا رَزَقْتَنِي',
        transliteration: 'Allahumma barik li fima razaqtani',
        translation: 'O Allah, bless me in what You have provided me',
        reference: 'Sahih al-Bukhari 5379',
        audioUrl: null,
      },
      {
        id: 12,
        title: tr("dua.duaForGoodProvision"),
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar',
        translation: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire',
        reference: 'Surah Al-Baqarah 2:201',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'forgiveness',
    title: tr("dua.duaForForgiveness"),
    icon: 'heart',
    duas: [
      {
        id: 13,
        title: tr("dua.seekingForgiveness"),
        arabic: 'اللَّهُمَّ اغْفِرْ لِي',
        transliteration: 'Allahummaghfirli',
        translation: 'O Allah, forgive me',
        reference: 'Sahih Muslim 484',
        audioUrl: null,
      },
      {
        id: 14,
        title: tr("dua.comprehensiveForgivenessDua"),
        arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
        transliteration: 'Rabbi ghfirli wa tub \'alayya innaka antat-tawwabur-rahim',
        translation: 'My Lord, forgive me and accept my repentance, for You are the Accepter of Repentance, the Merciful',
        reference: 'Sahih al-Bukhari 6307',
        audioUrl: null,
      },
      {
        id: 15,
        title: tr("dua.astaghfirullah"),
        arabic: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        reference: 'General',
        audioUrl: null,
      },
      {
        id: 16,
        title: tr("dua.duaOfProphetAdam"),
        arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
        transliteration: 'Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin',
        translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers',
        reference: 'Surah Al-A\'raf 7:23',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'health',
    title: tr("dua.duaForHealth"),
    icon: 'medical',
    duas: [
      {
        id: 17,
        title: tr("dua.duaForHealing"),
        arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي',
        transliteration: 'Allahumma \'afini fi badani, Allahumma \'afini fi sam\'i, Allahumma \'afini fi basari',
        translation: 'O Allah, grant me health in my body, O Allah, grant me health in my hearing, O Allah, grant me health in my sight',
        reference: 'Sunan Abu Dawud 5090',
        audioUrl: null,
      },
      {
        id: 18,
        title: tr("dua.duaForSickPerson"),
        arabic: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ وَاشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا',
        transliteration: 'Allahumma rabban-nasi adhhibil-ba\'sa washfi antash-shafi la shifa\'a illa shifa\'uka shifa\'an la yughadiru saqaman',
        translation: 'O Allah, Lord of mankind, remove the harm and cure, for You are the Healer. There is no cure except Your cure, a cure that leaves no illness',
        reference: 'Sahih al-Bukhari 5743',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'protection',
    title: tr("dua.duaForProtection"),
    icon: 'shield',
    duas: [
      {
        id: 19,
        title: tr("dua.seekingProtectionFromEvil"),
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا',
        transliteration: 'Allahumma inni a\'udhu bika min sharri nafsi wa min sharri kulli dabatin anta akhidhun binasiyatiha',
        translation: 'O Allah, I seek refuge in You from the evil of my soul and from the evil of every living creature that You hold by its forelock',
        reference: 'Sunan at-Tirmidhi 3522',
        audioUrl: null,
      },
      {
        id: 20,
        title: tr("dua.morningProtection"),
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq',
        translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created',
        reference: 'Sahih Muslim 2708',
        audioUrl: null,
      },
    ],
  },
  {
    id: 'guidance',
    title: tr("dua.duaForGuidance"),
    icon: 'compass',
    duas: [
      {
        id: 21,
        title: tr("dua.duaForGuidance"),
        arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
        transliteration: 'Rabbana la tuzigh qulubana ba\'da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-wahhab',
        translation: 'Our Lord, do not let our hearts deviate after You have guided us. Grant us Your mercy. You are indeed the Giver of all gifts',
        reference: 'Surah Ali Imran 3:8',
        audioUrl: null,
      },
      {
        id: 22,
        title: tr("dua.duaForRightPath"),
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        transliteration: 'Ihdinas-siratal-mustaqim',
        translation: 'Guide us to the straight path',
        reference: 'Surah Al-Fatiha 1:6',
        audioUrl: null,
      },
    ],
  },
];

  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDua, setSelectedDua] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedDuas, setDownloadedDuas] = useState([]);
  const [downloadedDuaTexts, setDownloadedDuaTexts] = useState(new Set());
  const [downloadingDua, setDownloadingDua] = useState(null);
  const [downloadingDuaText, setDownloadingDuaText] = useState(null);
  
  // Database state
  const [dbCategories, setDbCategories] = useState([]);
  const [dbDuas, setDbDuas] = useState({}); // categoryId -> duas array
  const [duaCounts, setDuaCounts] = useState({}); // categoryId -> count
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingDuas, setLoadingDuas] = useState(false);
  const [mergedCategories, setMergedCategories] = useState([]);

  useEffect(() => {
    activeCategory.current = null;
    setDbCategories([]); setDuaCounts({});
    setSelectedCategory(null);
    setSelectedDua(null);
    setDbDuas({});
    setDownloadedDuaTexts(new Set());
    loadDownloadedDuas();
    loadDownloadedDuaTexts();
    fetchCategories();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [locale]);

  useEffect(() => {
    // Merge hardcoded and DB categories
    mergeCategories();
  }, [dbCategories, duaCounts, locale]);

  useEffect(() => {
    // Stop audio when dua changes
    if (sound) {
      sound.unloadAsync().catch(() => {});
      setSound(null);
      setIsPlaying(false);
    }
  }, [selectedDua?.id, locale]);

  // A storage read may finish after the reader has opened a different dua.
  useEffect(() => {
    if (!selectedDua?.id) return;
    let active = true;
    const id = String(selectedDua.id);
    getDownloadedDuaText(id, locale).then(saved => {
      if (!active) return;
      setDownloadedDuaTexts(prev => {
        const updated = new Set(prev);
        if (saved) updated.add(id); else updated.delete(id);
        return updated;
      });
      if (saved) setSelectedDua(prev => {
        if (String(prev?.id) !== id) return prev;
        if (prev.contentLanguage === locale && prev.translationSource) return { ...prev, isDownloaded: true };
        return {
          ...prev, ...saved, id: prev.id,
          audioUrl: prev.audioUrl || saved.audioUrl,
          isDownloaded: true,
        };
      });
    }).catch(() => {});
    return () => { active = false; };
  }, [selectedDua?.id, locale]);

  const loadDownloadedDuas = async () => {
    try {
      const list = await getDownloadedDuaAudioList();
      setDownloadedDuas(list);
    } catch (error) {
      // Error loading downloaded duas (non-critical)
    }
  };

  const loadDownloadedDuaTexts = async () => {
    try {
      const ids = await getDownloadedDuaTextIds(locale);
      if (localeRef.current === locale) setDownloadedDuaTexts(new Set(ids));
    } catch (error) {
      // Error loading downloaded dua texts (non-critical)
    }
  };

  const fetchCategories = async () => {
    const key = '@dua_catalog_v2_' + locale;
    setLoadingCategories(true);
    try {
      const saved = JSON.parse(await AsyncStorage.getItem(key) || 'null');
      if (saved && localeRef.current === locale) {setDbCategories(saved.categories);setDuaCounts(saved.counts);}
      const [categories,counts] = await Promise.all([fetchDuaCategories(locale), fetchDuaCountsByCategory()]);
      if (localeRef.current !== locale || !categories.length) return;
      setDbCategories(categories);setDuaCounts(counts);
      await AsyncStorage.setItem(key,JSON.stringify({categories,counts}));
    } catch { /* The bundled and saved catalogs remain available. */ }
    finally { if (localeRef.current === locale) setLoadingCategories(false); }
  };

  const mergeCategories = () => {
    // Start with hardcoded categories, but map them to use DB category data when available
    const merged = DUA_CATEGORIES.map((hardcodedCat) => {
      // Find matching DB category by slug (hardcoded id matches slug)
      const dbCat = dbCategories.find(db => db.slug === hardcodedCat.id);
      
      if (dbCat) {
        // Get count for this category
        const count = duaCounts[dbCat.id] || 0;
        
        // Use DB category data but keep hardcoded ID for reference
        return {
          id: hardcodedCat.id, // Keep hardcoded ID for UI consistency
          title: dbCat.isLocalized ? dbCat.name : hardcodedCat.title,
          icon: dbCat.icon || hardcodedCat.icon,
          duas: hardcodedCat.duas,
          dbId: dbCat.id, // Store DB UUID for queries
          slug: dbCat.slug,
          duaCount: count, // Store count for display
        };
      }
      
      // No DB match found, use hardcoded but mark for DB fetch (if it exists in DB later)
      return {
        ...hardcodedCat,
        duas: hardcodedCat.duas,
        dbId: bundledCategoryIds[hardcodedCat.id],
        duaCount: hardcodedCat.duas.length,
      };
    });
    
    // Add any new DB categories that don't match hardcoded ones
    dbCategories.forEach((dbCat) => {
      const existsInHardcoded = DUA_CATEGORIES.some(hc => hc.id === dbCat.slug);
      if (!existsInHardcoded) {
        const count = duaCounts[dbCat.id] || 0;
        merged.push({
          id: dbCat.slug || dbCat.id,
          title: dbCat.name,
          icon: dbCat.icon || 'book',
          duas: [],
          isFromDb: true,
          dbId: dbCat.id,
          slug: dbCat.slug,
          duaCount: count,
        });
      }
    });
    
    setMergedCategories(merged);
  };

  const handleCategorySelect = async (category) => {
    activeCategory.current = category.dbId || category.id;
    setSelectedCategory(category);
    if (category.dbId) await fetchCategoryDuas(category.dbId, category);
  };

  const fetchCategoryDuas = async (categoryId, category) => {
    const current = () => activeCategory.current === categoryId && localeRef.current === locale;
    setLoadingDuas(true);
    try {
      const ids = await getDownloadedDuaTextIds(locale);
      const saved = (await Promise.all(ids.map(id => getDownloadedDuaText(id,locale))))
        .filter(d => d && (d.category_id === categoryId || (!d.category_id && category.duas?.some(v => String(v.id) === String(d.id)))))
        .map(d => ({...d,isDownloaded:true}));
      if (!current()) return;
      const initial = saved.length ? saved : category.duas;
      if (initial?.length) {setSelectedCategory({...category,duas:initial});setLoadingDuas(false);}
      const remote = await fetchDuasByCategory(categoryId,locale);
      if (!current() || !remote.length) return;
      const online = new Set(remote.map(d => String(d.id)));
      const offline = new Set(saved.map(d => String(d.id)));
      const rows = [...remote.map(d => ({...d,isDownloaded:offline.has(String(d.id))})),...saved.filter(d => !online.has(String(d.id)))];
      setSelectedCategory({...category,duas:rows});
      setDbDuas(prev => ({...prev,[categoryId]:rows}));
    } catch { /* Continue with saved and bundled content. */ }
    finally { if (current()) setLoadingDuas(false); }
  };

  const isDuaDownloaded = async (duaId) => {
    return await isDuaAudioDownloaded(duaId);
  };

  const getAudioUri = async (dua) => {
    if (!dua.audioUrl) {
      return null;
    }

    const duaIdString = String(dua.id);
    
    // Check if local file exists first
    const fileExists = await localAudioFileExists(duaIdString);
    if (fileExists) {
      const fileUri = getLocalAudioPath(duaIdString);
      return fileUri;
    }

    // Return R2 URL (will use fallback in playback if needed)
    return dua.audioUrl;
  };

  const playAudio = async (dua) => {
    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        return;
      }

      if (!dua.audioUrl) {
        Alert.alert(tr("dua.noAudio"), tr("dua.audioIsNotAvailableForThisDua"));
        return;
      }

      setIsLoading(true);
      let audioUri = await getAudioUri(dua);
      
      if (!audioUri) {
        setIsLoading(false);
        return;
      }

      // If using R2 URL, implement fallback mechanism
      let newSound;
      if (!audioUri.startsWith('file://') && dua.audioUrlFallback) {
        // Remote URL with fallback available
        try {
          // Try primary URL first with shorter timeout (15 seconds)
          const quickTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Audio loading timeout')), 15000);
          });

          const loadPromise = Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );

          newSound = (await Promise.race([loadPromise, quickTimeoutPromise])).sound;
        } catch (primaryError) {
          // Fallback to fallback URL
          audioUri = dua.audioUrlFallback;
          
          // Try again with fallback URL
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Audio loading timeout')), 60000);
          });

          const loadPromise = Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );

          newSound = (await Promise.race([loadPromise, timeoutPromise])).sound;
        }
      } else {
        // Local file or no fallback - direct load
        const { sound: createdSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        newSound = createdSound;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setSound(null);
        }
      });

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      // Error playing audio
      Alert.alert(tr("status.error", { ns: 'common' }), tr("dua.failedToPlayAudioPleaseTryAgain"));
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const downloadAudio = async (dua) => {
    if (!dua.audioUrl) {
      Alert.alert(tr("dua.noAudio"), tr("dua.audioIsNotAvailableForThisDua"));
      return;
    }

    const duaIdString = String(dua.id);
    const isDownloaded = await isDuaAudioDownloaded(duaIdString);
    if (isDownloaded) {
      Alert.alert(tr("dua.alreadyDownloaded"), tr("dua.thisDuaAudioIsAlreadyDownloaded"));
      return;
    }

    try {
      setDownloadingDua(dua.id);
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
      }

      const fileUri = getLocalAudioPath(duaIdString);
      let audioUrl = dua.audioUrl;
      let downloadResult;

      // Try primary URL first with fallback if available
      if (dua.audioUrlFallback) {
        try {
          // Try primary URL first with shorter timeout (15 seconds)
          const quickTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download timeout')), 15000)
          );
          downloadResult = await Promise.race([
            FileSystem.downloadAsync(audioUrl, fileUri),
            quickTimeoutPromise
          ]);
        } catch (primaryError) {
          // Fallback to fallback URL
          audioUrl = dua.audioUrlFallback;
          
          // Delete any incomplete file
          try {
            const existingFileInfo = await FileSystem.getInfoAsync(fileUri);
            if (existingFileInfo.exists) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
          } catch (deleteError) {
            // Ignore
          }
          
          // Try with fallback URL
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download timeout')), 60000)
          );
          downloadResult = await Promise.race([
            FileSystem.downloadAsync(audioUrl, fileUri),
            timeoutPromise
          ]);
        }
      } else {
        // Direct download for URLs without fallback
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Download timeout')), 60000)
        );
        downloadResult = await Promise.race([
          FileSystem.downloadAsync(audioUrl, fileUri),
          timeoutPromise
        ]);
      }

      // Verify the file was actually downloaded
      const downloadedFileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (downloadResult.status === 200 && downloadedFileInfo.exists && downloadedFileInfo.size > 0) {
        // Mark audio as downloaded
        await saveDownloadedDuaAudio(duaIdString);
        await loadDownloadedDuas();
        
        // Automatically download text as well
        await downloadDuaText(dua, true); // true = silent (no alert)
        
        Alert.alert(tr("dua.success"), tr("dua.duaAudioAndTextDownloadedSuccessfully"));
      } else {
        throw new Error('Download failed - file not saved properly');
      }
    } catch (error) {
      // Error downloading audio
      Alert.alert(tr("status.error", { ns: 'common' }), tr("dua.failedToDownloadAudioPleaseCheckYourInternet"));
    } finally {
      setDownloadingDua(null);
    }
  };

  const downloadDuaText = async (dua, silent = false) => {
    try {
      setDownloadingDuaText(dua.id);
      const duaIdString = String(dua.id);
      
      // Get category ID from selected category or dua object
      let categoryId = dua.category_id;
      if (!categoryId && selectedCategory?.dbId) {
        categoryId = selectedCategory.dbId;
      }
      
      // Save dua text data with category_id for filtering
      const duaData = {
        contentLanguage: dua.contentLanguage || 'en',
        translationSource: dua.translationSource || null,
        requestedLocale: locale,
        id: duaIdString,
        title: dua.title,
        arabic: dua.arabic,
        transliteration: dua.transliteration || '',
        translation: dua.translation || '',
        reference: dua.reference || '',
        category_id: categoryId, // Save category_id for filtering
      };
      
      await saveDownloadedDua(duaIdString, duaData, locale);
      
      // Update state
      setDownloadedDuaTexts(prev => new Set([...prev, duaIdString]));
      
      if (!silent) {
        Alert.alert(tr("dua.success"), tr("dua.duaTextDownloadedSuccessfully"));
      }
    } catch (error) {
      // Error downloading dua text
      if (!silent) {
        Alert.alert(tr("status.error", { ns: 'common' }), tr("dua.failedToDownloadDuaText"));
      }
    } finally {
      setDownloadingDuaText(null);
    }
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
      padding: 20,
      alignItems: 'center',
      borderWidth: 0,
      width: CARD_WIDTH,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    categoryIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: colors.iconBackground,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    categoryCount: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    duaCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      borderWidth: 0,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    duaTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    duaArabic: {
      writingDirection: 'rtl',
      fontSize: 24,
      color: colors.text,
      textAlign: 'right',
      marginBottom: 10,
      fontFamily: 'System',
    },
    duaTransliteration: {
      writingDirection: 'ltr',
      fontSize: 16,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    duaTranslation: {
      fontSize: 14,
      color: colors.text,
      marginTop: 8,
    },
  });

  const styles = StyleSheet.create({
    categoriesContainer: {
      padding: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    backButton: {
      padding: 5,
    },
    categoryHeader: {
      padding: 20,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    duaList: {
      flex: 1,
      padding: 20,
    },
    duaHeader: {
      padding: 20,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    duaContent: {
      flex: 1,
      padding: 20,
    },
    referenceContainer: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.borderVisible || '#e0e0e0',
    },
    referenceLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    referenceText: {
      fontSize: 14,
      fontStyle: 'italic',
    },
    audioControls: {
      flexDirection: 'row',
      marginTop: 20,
      justifyContent: 'space-between',
    },
    audioButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 10,
    },
    audioButtonLeft: {
      marginEnd: 5,
    },
    audioButtonRight: {
      marginStart: 5,
    },
    audioButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (selectedDua) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View style={[styles.duaHeader, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <TouchableOpacity
              onPress={() => setSelectedDua(null)}
              style={styles.backButton}
            >
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.duaTitle}>{selectedDua.title}</Text>
          </View>
          <ScrollView style={styles.duaContent}>
            <View style={dynamicStyles.duaCard}>
              <Text style={dynamicStyles.duaArabic}>{selectedDua.arabic}</Text>
              <Text style={dynamicStyles.duaTransliteration}>{selectedDua.transliteration}</Text>
              {locale !== (selectedDua.contentLanguage || 'en') && selectedDua.translation ? (
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{tr('dua.translationFallback', { language: getLanguage(locale).nativeName })}</Text>
              ) : null}
              {selectedDua.translation !== selectedDua.arabic && <Text style={[dynamicStyles.duaTranslation, { writingDirection: ['ar', 'ur'].includes(selectedDua.contentLanguage) ? 'rtl' : 'ltr', textAlign: ['ar', 'ur'].includes(selectedDua.contentLanguage) ? 'right' : 'left' }]}>{selectedDua.translation || tr('dua.translationUnavailable')}</Text>}
              {selectedDua.translationSource ? <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{tr('dua.translationSource', { source: selectedDua.translationSource })}</Text> : null}
              
              {selectedDua.reference && (
                <View style={styles.referenceContainer}>
                  <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>{tr("dua.reference")}</Text>
                  <Text style={[styles.referenceText, { color: colors.text }]}>{selectedDua.reference}</Text>
                </View>
              )}

              <View style={styles.audioControls}>
                <TouchableOpacity
                  style={[styles.audioButton, styles.audioButtonLeft, { backgroundColor: colors.cardSecondary }]}
                  onPress={() => playAudio(selectedDua)}
                  disabled={isLoading || !selectedDua.audioUrl}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
                      size={20} 
                      color={colors.text} 
                    />
                  )}
                  <Text style={[styles.audioButtonText, { color: colors.text, marginStart: 8 }]}>
                    {isLoading ? tr("status.loading", { ns: 'common' }) : isPlaying ? tr("dua.pause") : tr("dua.play")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.audioButton, styles.audioButtonRight, { backgroundColor: colors.cardSecondary }]}
                  onPress={() => downloadAudio(selectedDua)}
                  disabled={downloadingDua === selectedDua.id || !selectedDua.audioUrl || downloadedDuas.includes(String(selectedDua.id))}
                >
                  {downloadingDua === selectedDua.id ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons 
                      name={downloadedDuas.includes(String(selectedDua.id)) ? "checkmark-circle" : "download-outline"} 
                      size={20} 
                      color={colors.text} 
                    />
                  )}
                  <Text style={[styles.audioButtonText, { color: colors.text, marginStart: 8 }]}>
                    {downloadingDua === selectedDua.id 
                      ? tr("dua.downloading")
                      : downloadedDuas.includes(String(selectedDua.id)) 
                        ? tr("dua.audioDownloaded")
                        : tr("dua.downloadAudio")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.audioControls, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={[styles.audioButton, { backgroundColor: colors.cardSecondary, flex: 1 }]}
                  onPress={() => downloadDuaText(selectedDua)}
                  disabled={downloadingDuaText === selectedDua.id || downloadedDuaTexts.has(String(selectedDua.id))}
                >
                  {downloadingDuaText === selectedDua.id ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons 
                      name={downloadedDuaTexts.has(String(selectedDua.id)) ? "checkmark-circle" : "document-text-outline"} 
                      size={20} 
                      color={colors.text} 
                    />
                  )}
                  <Text style={[styles.audioButtonText, { color: colors.text, marginStart: 8 }]}>
                    {downloadingDuaText === selectedDua.id 
                      ? tr("dua.downloading")
                      : downloadedDuaTexts.has(String(selectedDua.id)) 
                        ? tr("dua.textDownloaded")
                        : tr("dua.downloadText")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedCategory) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View style={[styles.categoryHeader, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <TouchableOpacity
              onPress={() => { activeCategory.current=null; setSelectedCategory(null); }}
              style={styles.backButton}
            >
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.categoryTitle}>{selectedCategory.title}</Text>
          </View>
          <ScrollView style={styles.duaList}>
            {loadingDuas ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.text} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>{tr("dua.loadingDuas")}</Text>
              </View>
            ) : selectedCategory.duas && selectedCategory.duas.length > 0 ? (
              selectedCategory.duas.map((dua) => (
                <TouchableOpacity
                  key={dua.id}
                  style={dynamicStyles.duaCard}
                  onPress={() => setSelectedDua(dua)}
                >
                  <Text style={dynamicStyles.duaTitle}>{dua.title}</Text>
                  <Text style={dynamicStyles.duaArabic}>{dua.arabic}</Text>
                  <Text style={dynamicStyles.duaTransliteration}>{dua.transliteration}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary, textAlign: 'center' }}>{tr("dua.noDuasFoundInThisCategory")}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>{tr("navigation.duas", { ns: 'common' })}</Text>
          <Text style={dynamicStyles.headerSubtitle}>{tr("dua.supplicationsForDailyLife")}</Text>
        </View>

        <View style={styles.categoriesContainer}>
          {loadingCategories && mergedCategories.length === 0 && (
            <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={{ marginTop: 10, color: colors.textSecondary }}>{tr("dua.loadingCategories")}</Text>
            </View>
          )}
          {mergedCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[dynamicStyles.categoryCard, { marginBottom: 15 }]}
              onPress={() => handleCategorySelect(category)}
            >
              <View style={dynamicStyles.categoryIconContainer}>
                <Ionicons name={category.icon} size={32} color={colors.text} />
              </View>
              <Text style={dynamicStyles.categoryTitle}>{category.title}</Text>
              <Text style={dynamicStyles.categoryCount}>{tr("dua.valueDuas", { value1: category.duaCount !== undefined ? category.duaCount : category.duas ? category.duas.length : '...' })}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


