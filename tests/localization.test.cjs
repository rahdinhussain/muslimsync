const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');
const { act, create } = require('react-test-renderer');
const { createInstance } = require('i18next');
const { duaTextKey, mergeDuaTranslation } = require('../src/i18n/content-utils.cjs');
const { getTranslationEndpoints, translationStorageKey } = require('../src/i18n/quran-sources.cjs');

global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, '..');

// Run the actual locale provider/storage modules with only native I/O replaced.
// This exercises persistence and startup transitions without an iOS simulator.
function fixture(initial = {}, deviceLanguage = 'en-CA', supabase = {}) {
  const storage = new Map(Object.entries(initial));
  const i18n = createInstance();
  const cache = new Map();
  let failWrite = false;
  const nativeStorage = {
    getItem: async (key) => storage.get(key) ?? null,
    setItem: async (key, value) => { if (failWrite) throw new Error('disk full'); storage.set(key, value); },
    removeItem: async (key) => storage.delete(key),
    getAllKeys: async () => [...storage.keys()],
  };
  const mocks = {
    i18next: i18n,
    '@react-native-async-storage/async-storage': nativeStorage,
    'expo-localization': { getLocales: () => [{ languageTag: deviceLanguage }] },
    'expo-file-system/legacy': { documentDirectory: 'file:///test/' },
    '../lib/supabase': { supabase },
  };
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), {
      filename: file, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
    });
    const scopedRequire = (name) => {
      if (Object.prototype.hasOwnProperty.call(mocks, name)) return mocks[name];
      // Node provides these Intl functions natively; device builds import the
      // actual locale data. No translation/UI behavior is mocked here.
      if (name.startsWith('@formatjs/intl-pluralrules/')) return {};
      if (!name.startsWith('.')) return require(name);
      let resolved = path.resolve(path.dirname(file), name);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved += '/index.js';
      else if (!path.extname(resolved)) resolved += '.js';
      if (/\.(json|cjs)$/.test(resolved)) return require(resolved);
      return load(resolved);
    };
    vm.runInThisContext(`(function(require, module, exports) {${code}\n})`, { filename: file })(scopedRequire, module, module.exports);
    return module.exports;
  }
  return { storage, load, i18n, failWrites: () => { failWrite = true; } };
}

async function mountLocale(f) {
  const { LocaleProvider, useAppLocale } = f.load(root + '/src/context/LocaleContext.js');
  let state;
  function Observer() { state = useAppLocale(); return null; }
  let tree;
  await act(async () => { tree = create(React.createElement(LocaleProvider, null, React.createElement(Observer))); });
  return { state: () => state, unmount: async () => act(async () => tree.unmount()) };
}

test('fresh install suggests a supported device language but requires confirmation', async () => {
  const f = fixture({}, 'bn-BD');
  const app = await mountLocale(f);
  assert.equal(app.state().ready, true);
  assert.equal(app.state().locale, 'bn');
  assert.equal(app.state().needsChoice, true);
  assert.equal(f.storage.size, 0);
  await act(async () => app.state().chooseLanguage('ur'));
  assert.equal(app.state().needsChoice, false);
  assert.equal(app.state().isRTL, true);
  assert.equal(f.storage.get('@muslim_sync_language_v1'), 'ur');
  assert.notEqual(f.i18n.t('navigation.settings', { ns: 'common' }), 'Settings');
  await app.unmount();
});

test('saved choice wins over a different device language on the next launch', async () => {
  const f = fixture({ '@muslim_sync_language_v1': 'bn', '@quran_selected_translation': 'en.sahih' }, 'ar-SA');
  const app = await mountLocale(f);
  assert.equal(app.state().locale, 'bn');
  assert.equal(app.state().needsChoice, false);
  await act(async () => app.state().chooseLanguage('ar'));
  assert.equal(f.storage.get('@quran_selected_translation'), 'en.sahih');
  await app.unmount();
  const relaunched = await mountLocale(f);
  assert.equal(relaunched.state().locale, 'ar');
  assert.equal(relaunched.state().isRTL, true);
  assert.equal(relaunched.state().needsChoice, false);
  await relaunched.unmount();
});

test('failed storage write keeps the picker and the previous language', async () => {
  const f = fixture({}, 'en-CA');
  const app = await mountLocale(f);
  f.failWrites();
  await act(async () => assert.rejects(app.state().chooseLanguage('bn'), /disk full/));
  assert.equal(app.state().locale, 'en');
  assert.equal(app.state().needsChoice, true);
  await assert.rejects(app.state().chooseLanguage('zz'), /Unsupported/);
  await app.unmount();
});

test('invalid saved language and unsupported device language fall back safely', async () => {
  const f = fixture({ '@muslim_sync_language_v1': '<script>' }, 'de-DE');
  const app = await mountLocale(f);
  assert.equal(app.state().locale, 'en');
  assert.equal(app.state().needsChoice, true);
  await app.unmount();
});

test('only reviewed, attributed translations replace content; original Arabic stays intact', () => {
  const dua = { id: '1', name: 'Original title', arabic_text: 'بِسْمِ اللَّهِ', translation: 'Existing English', transliteration: 'Bismillah' };
  const draft = { locale: 'bn', reviewed: false, title: 'বাংলা', translation: 'বাংলা অর্থ', source: 'Test source' };
  assert.equal(mergeDuaTranslation(dua, draft, 'bn').translation, 'Existing English');
  const approved = mergeDuaTranslation(dua, { ...draft, reviewed: true }, 'bn');
  assert.equal(approved.contentLanguage, 'bn');
  assert.equal(approved.arabic, dua.arabic_text);
  assert.equal(approved.translationSource, 'Test source');
  assert.equal(mergeDuaTranslation(dua, { ...draft, reviewed: true }, 'ar').contentLanguage, 'en');
});

test('downloads are isolated by locale and legacy English never masquerades as another language', async () => {
  const f = fixture({ '@dua_downloaded_text_legacy': JSON.stringify({ id: 'legacy', translation: 'Old English' }) });
  const content = f.load(root + '/src/utils/duaStorage.js');
  await content.saveDownloadedDua('one', { id: 'one', translation: 'বাংলা', contentLanguage: 'bn' }, 'bn');
  assert.equal((await content.getDownloadedDuaText('one', 'bn')).translation, 'বাংলা');
  assert.equal(await content.getDownloadedDuaText('one', 'ar'), null);
  assert.equal(await content.getDownloadedDuaText('legacy', 'bn'), null);
  assert.equal((await content.getDownloadedDuaText('legacy', 'en')).contentLanguage, 'en');
  assert.deepEqual(await content.getDownloadedDuaTextIds('bn'), ['one']);
  assert.ok(f.storage.has(duaTextKey('one', 'bn')));
  f.failWrites();
  await assert.rejects(content.saveDownloadedDua('two', {}, 'bn'), /disk full/);
});

test('named Quran edition is suggested once and an explicit deselection stays deselected', async () => {
  const f = fixture();
  const quran = f.load(root + '/src/utils/quranStorage.js');
  assert.equal(await quran.getSelectedTranslation('bn'), 'bn.bengali');
  assert.equal(await quran.getSelectedTranslation('ur'), 'bn.bengali');
  f.storage.delete('@quran_selected_translation');
  assert.equal(await quran.getSelectedTranslation('ur'), null);
});

test('named editions only use matching providers and legacy unverified downloads are not relabeled', async () => {
  const sahih = getTranslationEndpoints('en.sahih', 1);
  assert.ok(sahih[0].url.endsWith('/surah/1/en.sahih'));
  assert.ok(sahih[1].url.includes('/translations/20?'));
  assert.ok(!sahih.some(({ url }) => url.includes('muhammadtaqiudd')));
  assert.ok(getTranslationEndpoints('ur.maududi', 1)[1].url.includes('/translations/97?'));
  assert.ok(getTranslationEndpoints('en.yusufali', 1)[1].url.includes('/translations/22?'));
  assert.deepEqual(getTranslationEndpoints('bn.bengali', 1), [{ url: 'https://api.alquran.cloud/v1/surah/1/bn.bengali', format: 'alquran' }]);
  assert.deepEqual(getTranslationEndpoints('bn.hoque', 115), []);
  const legacyData = JSON.stringify({ 1: [{ number: 1, text: 'Unknown legacy edition' }] });
  const f = fixture({ '@quran_translation_en.sahih': legacyData, '@quran_downloaded_translations': '["en.sahih"]' });
  const quran = f.load(root + '/src/utils/quranStorage.js');
  assert.equal(await quran.getSurahTranslation(1, 'en.sahih'), null);
  assert.equal(await quran.isTranslationDownloaded('en.sahih'), false);
  f.storage.set(translationStorageKey('en.sahih'), legacyData);
  assert.equal(await quran.isTranslationDownloaded('en.sahih'), true);
});

test('optional content translation failures preserve existing duas and categories', async () => {
  const supabase = {
    from(table) {
      const query = {
        select() { return this; }, eq() { return this; }, in() { return this; }, order() { return this; },
        then(resolve, reject) {
          if (table.endsWith('_translations')) return Promise.reject(new Error('optional table unavailable')).then(resolve, reject);
          const data = table === 'dua_categories'
            ? [{ id: 'c1', name: 'Morning' }]
            : [{ id: 'd1', name: 'Original title', translation: 'Existing English', arabic_text: 'بِسْمِ اللَّهِ' }];
          return Promise.resolve({ data }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const f = fixture({}, 'en', supabase);
  const content = f.load(root + '/src/utils/duaStorage.js');
  const categories = await content.fetchDuaCategories('bn');
  assert.equal(categories[0].name, 'Morning');
  assert.equal(categories[0].isLocalized, false);
  const duas = await content.fetchDuasByCategory('c1', 'bn');
  assert.equal(duas[0].translation, 'Existing English');
  assert.equal(duas[0].contentLanguage, 'en');
  assert.equal(duas[0].requestedLocale, 'bn');
});

test('visible numeric interpolation, dates and times use the selected locale', async () => {
  const f = fixture({ '@muslim_sync_language_v1': 'bn' });
  const app = await mountLocale(f);
  const locale = f.load(root + '/src/i18n/index.js');
  assert.equal(locale.formatNumber(114), '১১৪');
  assert.ok(locale.tr('quran.valueSurahs', { value1: 114 }).includes('১১৪'));
  assert.ok(locale.formatPrayerTime('19:30').includes('৩০'));
  assert.equal(locale.formatPrayerTime('--:--'), '--:--');
  assert.equal(locale.formatPrayerTime('invalid'), 'invalid');
  assert.ok(locale.formatDate(new Date(2026, 10, 13), { year: 'numeric', month: 'long', day: 'numeric' }).includes('২০২৬'));
  await app.unmount();
});
