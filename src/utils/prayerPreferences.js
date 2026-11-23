import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getCachedLocation, clearLocationCache } from './locationCache';
import schedule from './prayerSchedule.cjs';

const METHOD = '@prayer_method_v2';
const PLACE = '@prayer_place_v2';
export const CACHE = '@prayer_window_v3';
export const MADHHABS = ['shafii','hanafi','maliki','hanbali'];
export async function readMadhhab() {
  const value = await AsyncStorage.getItem('@prayer_madhhab');
  return MADHHABS.includes(value) ? value : 'shafii';
}
export const writeMadhhab = value => AsyncStorage.setItem('@prayer_madhhab', value);

export async function readMethod() {
  const [current, old] = await AsyncStorage.multiGet([METHOD, '@prayer_calculation_method']);
  return schedule.migrateMethod(current[1], old[1]);
}
export const writeMethod = value => AsyncStorage.setItem(METHOD, String(value));
export const savePlace = place => AsyncStorage.setItem(PLACE, JSON.stringify(place));
export async function readPlace() {
  const raw = await AsyncStorage.getItem(PLACE);
  return raw ? JSON.parse(raw) : null;
}
export async function locatePrayerPlace() {
  const { latitude, longitude } = await getCachedLocation(true);
  const coords = { latitude: Number(latitude.toFixed(2)), longitude: Number(longitude.toFixed(2)) };
  let label = [coords.latitude, coords.longitude].join(', ');
  try { const [address] = await Location.reverseGeocodeAsync(coords); label = address?.city || address?.subregion || label; } catch {}
  return { mode: 'gps', ...coords, label, updated: Date.now() };
}
export async function currentPrayerPlace() {
  await AsyncStorage.multiRemove(['@prayer_location_lat', '@prayer_location_lng', '@prayer_city_name']);
  const saved = await readPlace();
  if (saved?.mode !== 'gps') return saved;
  // Keep the last chosen area available offline; do not silently change cities.
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') { await clearLocationCache(); return null; }
  if (Date.now() - saved.updated < 300000) return saved;
  try { const fresh = await locatePrayerPlace(); await savePlace(fresh); return fresh; } catch { return { ...saved, lastKnown: true }; }
}
export function placeKey(place, method, madhhab) {
  return JSON.stringify(['windows-v3', method, madhhab, place.city?.toLowerCase() || '', place.country?.toLowerCase() || '', place.latitude ?? null, place.longitude ?? null]);
}
