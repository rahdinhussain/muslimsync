// Environment values are compiled into the public app bundle by Expo.
// Always override the URL and public client key together to avoid mixing projects.
function selectPublicBackend(defaults, overrides = {}) {
  const urlOverride = typeof overrides.url === 'string' ? overrides.url.trim() : '';
  const keyOverride = typeof overrides.anonKey === 'string' ? overrides.anonKey.trim() : '';
  if (Boolean(urlOverride) !== Boolean(keyOverride)) {
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY together.');
  }
  return {
    url: urlOverride || defaults.url,
    anonKey: keyOverride || defaults.anonKey,
    fromEnvironment: Boolean(urlOverride),
  };
}

module.exports = { selectPublicBackend };
