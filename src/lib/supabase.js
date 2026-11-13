import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import publicDefaults from '../config/publicBackend.json';
import backendConfig from '../config/backendConfig.cjs';

// Both fields are public client configuration. Expo replaces these static
// EXPO_PUBLIC references at bundle time; a clean checkout uses working defaults.
// Private/service-role credentials must never be used in this module.
const config = backendConfig.selectPublicBackend(publicDefaults, {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

export const supabase = createClient(config.url, config.anonKey);
