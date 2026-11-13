const test = require('node:test');
const assert = require('node:assert/strict');
const { selectPublicBackend } = require('../src/config/backendConfig.cjs');
const { validatePublicClientConfig } = require('../scripts/check-public-client-config.cjs');
const defaults = require('../src/config/publicBackend.json');
const jwt = (payload) => `test.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('a clean checkout uses the current working public backend without local files', () => {
  const config = selectPublicBackend(defaults);
  assert.equal(config.url, 'https://api.muslimsync.com');
  assert.equal(config.fromEnvironment, false);
  assert.equal(validatePublicClientConfig(config).keyType, 'anon JWT');
});

test('public environment overrides replace both settings and cannot mix projects', () => {
  const override = { url: 'https://example.supabase.co', anonKey: jwt({ role: 'anon' }) };
  const config = selectPublicBackend(defaults, override);
  assert.equal(config.url, override.url);
  assert.equal(config.anonKey, override.anonKey);
  assert.equal(config.fromEnvironment, true);
  assert.throws(() => selectPublicBackend(defaults, { url: override.url }), /together/);
  assert.throws(() => selectPublicBackend(defaults, { anonKey: override.anonKey }), /together/);
});

test('private roles, secret keys, invalid origins and expired JWTs fail before a build', () => {
  const config = { url: 'https://example.supabase.co', anonKey: jwt({ role: 'anon' }) };
  assert.throws(() => validatePublicClientConfig({ ...config, anonKey: jwt({ role: 'service_role' }) }), /anon-role/);
  assert.throws(() => validatePublicClientConfig({ ...config, anonKey: 'sb_secret_test' }), /public anon/);
  assert.throws(() => validatePublicClientConfig({ ...config, anonKey: jwt({ role: 'anon', exp: 1 }) }), /expired/);
  assert.throws(() => validatePublicClientConfig({ ...config, url: 'http://example.supabase.co' }), /HTTPS/);
  assert.throws(() => validatePublicClientConfig({ ...config, url: 'https://user:password@example.supabase.co' }), /HTTPS/);
  assert.throws(() => validatePublicClientConfig({ ...config, url: 'https://example.supabase.co/rest/v1' }), /HTTPS/);
  assert.equal(validatePublicClientConfig({ ...config, url: 'http://localhost:8000' }).keyType, 'anon JWT');
  assert.equal(validatePublicClientConfig({ ...config, anonKey: 'sb_publishable_example' }).keyType, 'publishable');
});
