import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { currentLocale } from '../i18n';
import contentUtils from '../i18n/content-utils.cjs';

const { textPrefix, duaTextKey, mergeDuaTranslation } = contentUtils;

const STORAGE_KEYS = {
  DOWNLOADED_AUDIO_LIST: '@dua_downloaded_audio_list',
  DOWNLOADED_TEXT_PREFIX: '@dua_downloaded_text_',
};

const AUDIO_DIR = `${FileSystem.documentDirectory}dua_audio/`;

async function pages(makeQuery) {
  const rows=[];
  for(let start=0;;start+=250){
    const {data,error}=await makeQuery().range(start,start+249);
    if(error)throw error;
    rows.push(...data);
    if(data.length<250)return rows;
  }
}
export async function fetchDuaCategories(locale=currentLocale()) {
  const cats=await pages(()=>supabase.from('dua_categories').select('id,name,icon,slug').order('name').order('id'));
  const translations=await pages(()=>supabase.from('dua_category_translations').select('category_id,name')
    .eq('locale',locale).eq('reviewed',true).order('category_id')).catch(()=>[]);
  const labels=new Map(translations.map(r=>[r.category_id,r.name]));
  return cats.map(c=>({...c,name:labels.get(c.id)||c.name,isLocalized:labels.has(c.id)}));
}
export async function fetchDuaCountsByCategory() {
  const rows=await pages(()=>supabase.from('duas').select('id,category_id').order('id'));
  return rows.reduce((counts,r)=>{counts[r.category_id]=(counts[r.category_id]||0)+1;return counts;},{});
}
export async function fetchDuasByCategory(categoryId, locale=currentLocale(), saved=[]) {
  const index=await pages(()=>supabase.from('duas').select('id').eq('category_id',categoryId)
    .order('sequence_number',{ascending:true,nullsLast:true}).order('id'));
  const byId=new Map(saved.map(d=>[String(d.id),d]));
  const missing=index.map(d=>d.id).filter(id=>!byId.has(id));
  for(let i=0;i<missing.length;i+=60) {
    const ids=missing.slice(i,i+60);
    const [rows,translations]=await Promise.all([
      supabase.from('duas').select('id,category_id,name,arabic_text,transliteration,translation,reference,audio_url,audio_url_fallback')
        .eq('category_id',categoryId).in('id',ids),
      Promise.resolve(supabase.from('dua_translations').select('dua_id,locale,title,translation,transliteration,source,reviewed,updated_at')
        .in('dua_id',ids).eq('locale',locale).eq('reviewed',true)).catch(()=>({data:[]}))
    ]);
    if(rows.error)throw rows.error;
    const reviewed=new Map((translations.data||[]).map(r=>[r.dua_id,r]));
    for(const d of rows.data)byId.set(d.id,mergeDuaTranslation(d,reviewed.get(d.id),locale));
  }
  const published=new Set(index.map(d=>d.id));
  return [...index.map(d=>byId.get(d.id)).filter(Boolean),...saved.filter(d=>!published.has(String(d.id)))];
}

/**
 * Save downloaded dua text to AsyncStorage
 * @param {string} duaId - UUID of the dua
 * @param {Object} duaData - Dua data object
 */
export const saveDownloadedDua = async (duaId, duaData, locale = currentLocale()) => {
  try {
    const key = duaTextKey(duaId, locale);
    await AsyncStorage.setItem(key, JSON.stringify({ ...duaData, schemaVersion: 2, requestedLocale: locale, contentLanguage: duaData.contentLanguage || 'en' }));
  } catch (error) {
    console.error('Error saving downloaded dua text:', error);
    throw error;
  }
};

/**
 * Check if dua text is downloaded
 * @param {string} duaId - UUID of the dua
 * @returns {Promise<boolean>}
 */
export const isDuaTextDownloaded = async (duaId, locale = currentLocale()) => {
  try {
    return (await getDownloadedDuaText(duaId, locale)) !== null;
  } catch (error) {
    console.error('Error checking downloaded dua text:', error);
    return false;
  }
};

/**
 * Get downloaded dua text
 * @param {string} duaId - UUID of the dua
 * @returns {Promise<Object|null>}
 */
export const getDownloadedDuaText = async (duaId, locale = currentLocale()) => {
  try {
    const key = duaTextKey(duaId, locale);
    let data = await AsyncStorage.getItem(key);
    // Old downloads have no language marker. They were English, so never
    // present them as a download of an Arabic/Bangla/Urdu translation.
    if (!data && locale === 'en') data = await AsyncStorage.getItem(`${STORAGE_KEYS.DOWNLOADED_TEXT_PREFIX}${duaId}`);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed.requestedLocale && parsed.requestedLocale !== locale) return null;
    return { ...parsed, requestedLocale: locale, contentLanguage: parsed.contentLanguage || 'en' };
  } catch (error) {
    console.error('Error getting downloaded dua text:', error);
    return null;
  }
};

export const getDownloadedDuaTextIds = async (locale = currentLocale()) => {
  const keys = await AsyncStorage.getAllKeys();
  const prefix = textPrefix(locale);
  const current = keys.filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length));
  const legacy = locale === 'en' ? keys.filter((key) => key.startsWith(STORAGE_KEYS.DOWNLOADED_TEXT_PREFIX) && !key.startsWith('@dua_downloaded_text_v2_')).map((key) => key.slice(STORAGE_KEYS.DOWNLOADED_TEXT_PREFIX.length)) : [];
  return [...new Set([...current, ...legacy])];
};

/**
 * Mark dua audio as downloaded
 * @param {string} duaId - UUID of the dua
 */
export const saveDownloadedDuaAudio = async (duaId) => {
  try {
    const list = await getDownloadedDuaAudioList();
    if (!list.includes(duaId)) {
      list.push(duaId);
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_AUDIO_LIST, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Error saving downloaded dua audio:', error);
  }
};

/**
 * Check if dua audio is downloaded
 * @param {string} duaId - UUID of the dua
 * @returns {Promise<boolean>}
 */
export const isDuaAudioDownloaded = async (duaId) => {
  try {
    const list = await getDownloadedDuaAudioList();
    return list.includes(duaId);
  } catch (error) {
    console.error('Error checking downloaded dua audio:', error);
    return false;
  }
};

/**
 * Get list of downloaded dua audio IDs
 * @returns {Promise<Array>}
 */
export const getDownloadedDuaAudioList = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_AUDIO_LIST);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting downloaded dua audio list:', error);
    return [];
  }
};

/**
 * Remove downloaded dua audio from list
 * @param {string} duaId - UUID of the dua
 */
export const removeDownloadedDuaAudio = async (duaId) => {
  try {
    const list = await getDownloadedDuaAudioList();
    const updated = list.filter(id => id !== duaId);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_AUDIO_LIST, JSON.stringify(updated));
    
    // Also delete the audio file
    const fileUri = `${AUDIO_DIR}${duaId}.mp3`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (fileError) {
      console.error('Error deleting audio file:', fileError);
    }
  } catch (error) {
    console.error('Error removing downloaded dua audio:', error);
  }
};

/**
 * Remove downloaded dua text
 * @param {string} duaId - UUID of the dua
 */
export const removeDownloadedDuaText = async (duaId) => {
  try {
    const key = `${STORAGE_KEYS.DOWNLOADED_TEXT_PREFIX}${duaId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing downloaded dua text:', error);
  }
};

/**
 * Get local audio file path for a dua
 * @param {string} duaId - UUID of the dua
 * @returns {string} File path
 */
export const getLocalAudioPath = (duaId) => {
  return `${AUDIO_DIR}${duaId}.mp3`;
};

/**
 * Check if local audio file exists
 * @param {string} duaId - UUID of the dua
 * @returns {Promise<boolean>}
 */
export const localAudioFileExists = async (duaId) => {
  try {
    const fileUri = getLocalAudioPath(duaId);
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo.exists && fileInfo.size > 0;
  } catch (error) {
    return false;
  }
};

