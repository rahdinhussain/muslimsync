#!/usr/bin/env node
const { selectPublicBackend } = require('../src/config/backendConfig.cjs');
const defaults = require('../src/config/publicBackend.json');

// This checks client configuration, not a JWT signature. The backend remains
// responsible for authentication and database row-level authorization.
function validatePublicClientConfig(config, now = Date.now()) {
  let url;
  try { url = new URL(config.url); } catch { throw new Error('The public Supabase URL must be a valid origin.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) {
    throw new Error('Use an HTTPS Supabase origin, or an HTTP localhost origin for development.');
  }
  if (typeof config.anonKey !== 'string' || !config.anonKey.trim()) {
    throw new Error('A public Supabase anon or publishable key is required.');
  }
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.anonKey)) return { origin: url.origin, keyType: 'publishable' };
  let payload;
  try {
    const parts = config.anonKey.split('.');
    if (parts.length !== 3) throw new Error();
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch { throw new Error('Use a public anon JWT or a Supabase publishable key.'); }
  if (payload.role !== 'anon') throw new Error('Only anon-role JWTs may be bundled in the client. Never use a service-role key.');
  if (payload.exp !== undefined && (typeof payload.exp !== 'number' || payload.exp * 1000 <= now)) throw new Error('The public Supabase anon key has expired or has an invalid expiry.');
  if (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || payload.nbf * 1000 > now)) throw new Error('The public Supabase anon key is not yet valid.');
  return { origin: url.origin, keyType: 'anon JWT' };
}

if (require.main === module) {
  try {
    // Match Expo's local .env precedence without logging values. EAS runs this
    // hook after npm ci, so the SDK's environment loader is available.
    require('@expo/env').loadProjectEnv(process.cwd(), { silent: true });
    const config = selectPublicBackend(defaults, {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    });
    const result = validatePublicClientConfig(config);
    console.log(`Public client configuration valid: ${result.origin} (${config.fromEnvironment ? 'Expo environment overrides' : 'bundled public defaults'}).`);
  } catch (error) {
    // Error messages name configuration requirements, never key values.
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validatePublicClientConfig };
