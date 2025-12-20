import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const STORAGE_KEYS = {
  DOWNLOADED_AUDIO: '@quran_downloaded_audio',
};

export default function AudioPlayer({ surahNumber, reciterId, onComplete }) {
  const { colors, isDark } = useTheme();
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUsingDownloaded, setIsUsingDownloaded] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.unloadAsync().catch((err) => {
          console.log('Error unloading sound:', err);
        });
      }
    };
  }, [sound]);

  // Stop and reset audio when reciter or surah changes
  useEffect(() => {
    const handleReciterOrSurahChange = async () => {
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.log('Error stopping audio on reciter/surah change:', error);
        }
        setSound(null);
        setIsPlaying(false);
        setIsPaused(false);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
        setError(null);
      }
    };

    handleReciterOrSurahChange();
  }, [reciterId, surahNumber]);

  const getAudioUri = async () => {
    // Always check if the specific surah file exists locally first (regardless of AsyncStorage list)
    if (reciterId) {
      const audioDir = `${FileSystem.documentDirectory}quran_audio/${reciterId}/`;
      const fileUri = `${audioDir}${surahNumber}.mp3`;
      console.log(`Checking for local audio file: ${fileUri}, reciterId: ${reciterId}, surahNumber: ${surahNumber}`);
      
      try {
        // First check if directory exists
        const dirInfo = await FileSystem.getInfoAsync(audioDir);
        if (dirInfo.exists) {
          // List files in directory for debugging
          try {
            const files = await FileSystem.readDirectoryAsync(audioDir);
            console.log(`Files in directory ${audioDir}:`, files);
          } catch (listError) {
            console.log('Could not list directory:', listError);
          }
        }
        
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        console.log(`File info for ${fileUri}:`, { exists: fileInfo.exists, size: fileInfo.size });
        
        if (fileInfo.exists && fileInfo.size > 0) {
          console.log('✅ Using downloaded audio:', fileUri);
          setIsUsingDownloaded(true);
          return fileUri; // Use downloaded file
        } else {
          console.log('❌ Downloaded audio file not found or empty:', fileUri, fileInfo);
        }
      } catch (fileError) {
        console.log('❌ Error checking file:', fileError);
      }
    }

    // Not downloaded locally – fall back to online sources
    setIsUsingDownloaded(false);

    const surahNum = surahNumber.toString().padStart(3, '0');

    // If this is the Arabic & English combined recitation, stream from your R2 bucket
    if (reciterId === 'arabic_english_r2') {
      const R2_BASE_URL = 'https://cdn.muslimsync.com/quran';
      const r2Url = `${R2_BASE_URL}/${surahNum}.mp3`;
      console.log('Primary API audio (R2 Arabic & English):', r2Url);
      return r2Url;
    }

    // Default Arabic recitation (Mishary) – online sources
    const cdnUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
    const mp3QuranUrl = `https://server8.mp3quran.net/afs/${surahNum}.mp3`;

    console.log('Primary API audio (Islamic Network):', cdnUrl);
    console.log('Fallback API audio (MP3Quran):', mp3QuranUrl);

    return cdnUrl;
  };

  const playAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Set audio mode only when actually playing (non-blocking)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      }).catch((err) => {
        console.log('Audio mode error (non-critical):', err);
      });

      if (sound) {
        await sound.unloadAsync();
      }

      // Get audio URI (downloaded or API)
      let audioUri = await getAudioUri();
      console.log('Playing audio from:', audioUri);

      // For Arabic & English R2, try custom domain first, fallback to dev URL if it fails
      let newSound;
      const R2_DEV_URL = 'https://pub-2c4edd4aaabe4396b691206a23c98516.r2.dev/quran';
      
      if (reciterId === 'arabic_english_r2' && audioUri.includes('cdn.muslimsync.com')) {
        try {
          // Try custom domain first with shorter timeout (15 seconds)
          const quickTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Audio loading timeout')), 15000);
          });

          const loadPromise = Audio.Sound.createAsync(
            { uri: audioUri },
            { 
              shouldPlay: true,
              isLooping: false,
            }
          );

          newSound = (await Promise.race([loadPromise, quickTimeoutPromise])).sound;
          console.log('✅ Custom domain worked!');
        } catch (customDomainError) {
          console.log('❌ Custom domain failed, trying dev URL fallback:', customDomainError.message);
          // Fallback to dev URL
          const surahNum = surahNumber.toString().padStart(3, '0');
          audioUri = `${R2_DEV_URL}/${surahNum}.mp3`;
          console.log('Trying fallback URL:', audioUri);
          
          // Try again with dev URL
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Audio loading timeout')), 60000);
          });

          const loadPromise = Audio.Sound.createAsync(
            { uri: audioUri },
            { 
              shouldPlay: true,
              isLooping: false,
            }
          );

          newSound = (await Promise.race([loadPromise, timeoutPromise])).sound;
          console.log('✅ Dev URL fallback worked!');
        }
      } else {
        // For other reciters, use normal flow
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Audio loading timeout')), 60000);
        });

        const loadPromise = Audio.Sound.createAsync(
          { uri: audioUri },
          { 
            shouldPlay: true,
            isLooping: false,
          }
        );

        newSound = (await Promise.race([loadPromise, timeoutPromise])).sound;
      }

      console.log('Audio loaded successfully from:', audioUri);
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // Update progress
          if (status.positionMillis !== undefined && status.durationMillis !== undefined) {
            setPlaybackPosition(status.positionMillis);
            setPlaybackDuration(status.durationMillis);
          }
          
          // Handle playback state
          if (status.isPlaying) {
            setIsPlaying(true);
            setIsPaused(false);
          } else if (status.didJustFinish) {
            console.log('Audio finished playing');
            setIsPlaying(false);
            setIsPaused(false);
            setPlaybackPosition(0);
            if (onComplete) {
              onComplete();
            }
          } else if (status.isPlaying === false && !status.didJustFinish) {
            setIsPaused(true);
          }
          
          if (status.error) {
            console.error('Playback error:', status.error);
            setError('Playback error');
            setIsPlaying(false);
            setIsPaused(false);
          }
        } else if (status.error) {
          console.error('Audio loading error:', status.error);
          setError('Failed to load audio');
          setIsPlaying(false);
          setIsPaused(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      let errorMessage = `Failed to load audio: ${error.message || 'Unknown error'}`;
      if (reciterId === 'arabic_english_r2') {
        if (error.message && (error.message.includes('timeout') || error.message.includes('-1003'))) {
          errorMessage = 'Cannot reach audio server. Please check your internet connection or download the audio for offline use. If this persists, the custom domain may need time to propagate or there may be a DNS issue.';
        }
      }
      setError(errorMessage);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseAudio = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resumeAudio = async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setIsPaused(false);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      setSound(null);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const replayAudio = async () => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        setIsPlaying(true);
        setIsPaused(false);
      } else {
        // If no sound loaded, start playing from beginning
        await playAudio();
      }
    } catch (error) {
      console.error('Error replaying audio:', error);
      // If replay fails, try playing from scratch
      await playAudio();
    }
  };

  const toggleAudio = () => {
    if (isPlaying && !isPaused) {
      pauseAudio();
    } else if (isPaused) {
      resumeAudio();
    } else {
      playAudio();
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 12,
      marginVertical: 10,
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    text: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 12,
      color: colors.text,
      marginTop: 4,
    },
    progressSlider: {
      width: '100%',
      height: 40,
      marginTop: 8,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    timeText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });

  const formatTime = (milliseconds) => {
    if (!milliseconds || isNaN(milliseconds)) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = async (value) => {
    try {
      if (sound) {
        const positionMillis = value * playbackDuration;
        await sound.setPositionAsync(positionMillis);
        setPlaybackPosition(positionMillis);
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity style={dynamicStyles.button} onPress={toggleAudio} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Ionicons
            name={isPaused ? 'play' : isPlaying ? 'pause' : 'play'}
            size={20}
            color={colors.text}
          />
        )}
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={dynamicStyles.text}>
          {isPlaying && !isPaused ? 'Playing audio...' : isPaused ? 'Paused' : 'Tap to play audio'}
        </Text>
        {isUsingDownloaded && !error && (
          <Text style={[dynamicStyles.errorText, { color: colors.textSecondary, fontSize: 11 }]}>
            Playing from offline
          </Text>
        )}
        {error && <Text style={dynamicStyles.errorText}>{error}</Text>}
        {(isPlaying || isPaused) && playbackDuration > 0 && (
          <>
            <Slider
              style={dynamicStyles.progressSlider}
              minimumValue={0}
              maximumValue={1}
              value={playbackDuration > 0 ? playbackPosition / playbackDuration : 0}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={colors.text}
              maximumTrackTintColor={colors.textSecondary}
              thumbTintColor={colors.text}
              disabled={isLoading}
            />
            <View style={dynamicStyles.timeContainer}>
              <Text style={dynamicStyles.timeText}>{formatTime(playbackPosition)}</Text>
              <Text style={dynamicStyles.timeText}>{formatTime(playbackDuration)}</Text>
            </View>
          </>
        )}
      </View>
      {(isPlaying || isPaused) && (
        <TouchableOpacity onPress={replayAudio} style={{ marginLeft: 8 }}>
          <Ionicons name="reload" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

