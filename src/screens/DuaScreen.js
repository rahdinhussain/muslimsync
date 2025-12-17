import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@dua_downloaded_audio';
const AUDIO_DIR = `${FileSystem.documentDirectory}dua_audio/`;
const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - 40 - CARD_MARGIN) / 2; // 40 for container padding, CARD_MARGIN for gap between cards

// Function to fetch duas from API (for future use)
const fetchDuasFromAPI = async () => {
  try {
    // Example API endpoints (replace with actual API URLs):
    // const response = await fetch('https://api.example.com/duas');
    // const data = await response.json();
    // return data;
    
    // For now, return null to use hard-coded data
    return null;
  } catch (error) {
    console.error('Error fetching duas from API:', error);
    return null;
  }
};

const DUA_CATEGORIES = [
  {
    id: 'morning',
    title: 'Morning Duas',
    icon: 'sunny',
    duas: [
      {
        id: 1,
        title: 'Morning Dua',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
        transliteration: 'Asbahna wa asbahal mulku lillah',
        translation: 'We have reached the morning and at this very time all sovereignty belongs to Allah',
        reference: 'Sahih Muslim 2723',
        audioUrl: null, // Can be added later with actual audio URLs
      },
      {
        id: 2,
        title: 'Protection Dua',
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
    title: 'Evening Duas',
    icon: 'moon',
    duas: [
      {
        id: 3,
        title: 'Evening Dua',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
        transliteration: 'Amsayna wa amsal mulku lillah',
        translation: 'We have reached the evening and at this very time all sovereignty belongs to Allah',
        reference: 'Sahih Muslim 2723',
        audioUrl: null,
      },
      {
        id: 4,
        title: 'Protection Dua',
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
    title: 'Food & Drink',
    icon: 'restaurant',
    duas: [
      {
        id: 5,
        title: 'Before Eating',
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'In the name of Allah',
        reference: 'Sahih al-Bukhari 5376',
        audioUrl: null,
      },
      {
        id: 6,
        title: 'After Eating',
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
    title: 'Travel',
    icon: 'airplane',
    duas: [
      {
        id: 7,
        title: 'Travel Dua',
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
    title: 'Sleep',
    icon: 'bed',
    duas: [
      {
        id: 8,
        title: 'Before Sleep',
        arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي',
        transliteration: 'Bismika rabbi wada\'tu janbi',
        translation: 'In Your name, my Lord, I lay down my side',
        reference: 'Sahih al-Bukhari 6320',
        audioUrl: null,
      },
      {
        id: 9,
        title: 'After Waking',
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
    title: 'Dua for Rizq (Sustenance)',
    icon: 'cash',
    duas: [
      {
        id: 10,
        title: 'Dua for Sustenance',
        arabic: 'اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
        transliteration: 'Allahumma akfini bihalalika \'an haramika, wa aghnini bifadhlika \'amman siwaka',
        translation: 'O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You',
        reference: 'Sunan at-Tirmidhi 3563',
        audioUrl: null,
      },
      {
        id: 11,
        title: 'Dua for Increase in Provision',
        arabic: 'اللَّهُمَّ بَارِكْ لِي فِيمَا رَزَقْتَنِي',
        transliteration: 'Allahumma barik li fima razaqtani',
        translation: 'O Allah, bless me in what You have provided me',
        reference: 'Sahih al-Bukhari 5379',
        audioUrl: null,
      },
      {
        id: 12,
        title: 'Dua for Good Provision',
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
    title: 'Dua for Forgiveness',
    icon: 'heart',
    duas: [
      {
        id: 13,
        title: 'Seeking Forgiveness',
        arabic: 'اللَّهُمَّ اغْفِرْ لِي',
        transliteration: 'Allahummaghfirli',
        translation: 'O Allah, forgive me',
        reference: 'Sahih Muslim 484',
        audioUrl: null,
      },
      {
        id: 14,
        title: 'Comprehensive Forgiveness Dua',
        arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
        transliteration: 'Rabbi ghfirli wa tub \'alayya innaka antat-tawwabur-rahim',
        translation: 'My Lord, forgive me and accept my repentance, for You are the Accepter of Repentance, the Merciful',
        reference: 'Sahih al-Bukhari 6307',
        audioUrl: null,
      },
      {
        id: 15,
        title: 'Astaghfirullah',
        arabic: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        reference: 'General',
        audioUrl: null,
      },
      {
        id: 16,
        title: 'Dua of Prophet Adam',
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
    title: 'Dua for Health',
    icon: 'medical',
    duas: [
      {
        id: 17,
        title: 'Dua for Healing',
        arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي',
        transliteration: 'Allahumma \'afini fi badani, Allahumma \'afini fi sam\'i, Allahumma \'afini fi basari',
        translation: 'O Allah, grant me health in my body, O Allah, grant me health in my hearing, O Allah, grant me health in my sight',
        reference: 'Sunan Abu Dawud 5090',
        audioUrl: null,
      },
      {
        id: 18,
        title: 'Dua for Sick Person',
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
    title: 'Dua for Protection',
    icon: 'shield',
    duas: [
      {
        id: 19,
        title: 'Seeking Protection from Evil',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا',
        transliteration: 'Allahumma inni a\'udhu bika min sharri nafsi wa min sharri kulli dabatin anta akhidhun binasiyatiha',
        translation: 'O Allah, I seek refuge in You from the evil of my soul and from the evil of every living creature that You hold by its forelock',
        reference: 'Sunan at-Tirmidhi 3522',
        audioUrl: null,
      },
      {
        id: 20,
        title: 'Morning Protection',
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
    title: 'Dua for Guidance',
    icon: 'compass',
    duas: [
      {
        id: 21,
        title: 'Dua for Guidance',
        arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
        transliteration: 'Rabbana la tuzigh qulubana ba\'da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-wahhab',
        translation: 'Our Lord, do not let our hearts deviate after You have guided us. Grant us Your mercy. You are indeed the Giver of all gifts',
        reference: 'Surah Ali Imran 3:8',
        audioUrl: null,
      },
      {
        id: 22,
        title: 'Dua for Right Path',
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        transliteration: 'Ihdinas-siratal-mustaqim',
        translation: 'Guide us to the straight path',
        reference: 'Surah Al-Fatiha 1:6',
        audioUrl: null,
      },
    ],
  },
];

export default function DuaScreen() {
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDua, setSelectedDua] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedDuas, setDownloadedDuas] = useState([]);
  const [downloadingDua, setDownloadingDua] = useState(null);

  useEffect(() => {
    loadDownloadedDuas();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    // Stop audio when dua changes
    if (sound) {
      sound.unloadAsync().catch(() => {});
      setSound(null);
      setIsPlaying(false);
    }
  }, [selectedDua?.id]);

  const loadDownloadedDuas = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDownloadedDuas(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading downloaded duas:', error);
    }
  };

  const isDuaDownloaded = (duaId) => {
    return downloadedDuas.includes(duaId);
  };

  const getAudioUri = async (dua) => {
    if (!dua.audioUrl) {
      Alert.alert('No Audio', 'Audio is not available for this dua.');
      return null;
    }

    // Check if downloaded
    if (isDuaDownloaded(dua.id)) {
      const fileUri = `${AUDIO_DIR}${dua.id}.mp3`;
      try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          return fileUri;
        }
      } catch (error) {
        console.log('Error checking downloaded file:', error);
      }
    }

    // Return API URL
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

      setIsLoading(true);
      const audioUri = await getAudioUri(dua);
      
      if (!audioUri) {
        setIsLoading(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

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
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const downloadAudio = async (dua) => {
    if (!dua.audioUrl) {
      Alert.alert('No Audio', 'Audio is not available for this dua.');
      return;
    }

    if (isDuaDownloaded(dua.id)) {
      Alert.alert('Already Downloaded', 'This dua audio is already downloaded.');
      return;
    }

    try {
      setDownloadingDua(dua.id);
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
      }

      const fileUri = `${AUDIO_DIR}${dua.id}.mp3`;
      const downloadResult = await FileSystem.downloadAsync(dua.audioUrl, fileUri);

      if (downloadResult.status === 200) {
        const updated = [...downloadedDuas, dua.id];
        setDownloadedDuas(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        Alert.alert('Success', 'Dua audio downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
      Alert.alert('Error', 'Failed to download audio. Please check your internet connection.');
    } finally {
      setDownloadingDua(null);
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
      fontSize: 24,
      color: colors.text,
      textAlign: 'right',
      marginBottom: 10,
      fontFamily: 'System',
    },
    duaTransliteration: {
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
      marginRight: 5,
    },
    audioButtonRight: {
      marginLeft: 5,
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
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.duaTitle}>{selectedDua.title}</Text>
          </View>
          <ScrollView style={styles.duaContent}>
            <View style={dynamicStyles.duaCard}>
              <Text style={dynamicStyles.duaArabic}>{selectedDua.arabic}</Text>
              <Text style={dynamicStyles.duaTransliteration}>{selectedDua.transliteration}</Text>
              <Text style={dynamicStyles.duaTranslation}>{selectedDua.translation}</Text>
              
              {selectedDua.reference && (
                <View style={styles.referenceContainer}>
                  <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>Reference:</Text>
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
                  <Text style={[styles.audioButtonText, { color: colors.text, marginLeft: 8 }]}>
                    {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.audioButton, styles.audioButtonRight, { backgroundColor: colors.cardSecondary }]}
                  onPress={() => downloadAudio(selectedDua)}
                  disabled={downloadingDua === selectedDua.id || !selectedDua.audioUrl || isDuaDownloaded(selectedDua.id)}
                >
                  {downloadingDua === selectedDua.id ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons 
                      name={isDuaDownloaded(selectedDua.id) ? "checkmark-circle" : "download-outline"} 
                      size={20} 
                      color={colors.text} 
                    />
                  )}
                  <Text style={[styles.audioButtonText, { color: colors.text, marginLeft: 8 }]}>
                    {downloadingDua === selectedDua.id 
                      ? 'Downloading...' 
                      : isDuaDownloaded(selectedDua.id) 
                        ? 'Downloaded' 
                        : 'Download'}
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
              onPress={() => setSelectedCategory(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.categoryTitle}>{selectedCategory.title}</Text>
          </View>
          <ScrollView style={styles.duaList}>
            {selectedCategory.duas.map((dua) => (
              <TouchableOpacity
                key={dua.id}
                style={dynamicStyles.duaCard}
                onPress={() => setSelectedDua(dua)}
              >
                <Text style={dynamicStyles.duaTitle}>{dua.title}</Text>
                <Text style={dynamicStyles.duaArabic}>{dua.arabic}</Text>
                <Text style={dynamicStyles.duaTransliteration}>{dua.transliteration}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <ScrollView style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>Duas</Text>
          <Text style={dynamicStyles.headerSubtitle}>
            Supplications for daily life
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          {DUA_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[dynamicStyles.categoryCard, { marginBottom: 15 }]}
              onPress={() => setSelectedCategory(category)}
            >
              <View style={dynamicStyles.categoryIconContainer}>
                <Ionicons name={category.icon} size={32} color={colors.text} />
              </View>
              <Text style={dynamicStyles.categoryTitle}>{category.title}</Text>
              <Text style={dynamicStyles.categoryCount}>
                {category.duas.length} Duas
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


