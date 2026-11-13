// Named editions are religious content, independent of the interface locale.
// Only use a fallback whose author AND language match the selected edition.
// IDs verified against the providers' edition/resource catalogs, 2026-11-13:
// https://api.quran.com/api/v4/resources/translations?language=en
// https://api.alquran.cloud/v1/edition/language/bn
// https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions.json
const QURAN_COM_EDITIONS = {
  'en.sahih': 20,
  'en.pickthall': 19,
  'en.yusufali': 22,
  'ur.maududi': 97,
};

function translationStorageKey(edition) {
  // Earlier versions mapped some IDs to a different author or language.
  // Preserve the old data on disk, but never label it as a verified edition.
  return `@quran_translation_v2_${edition}`;
}

function getTranslationEndpoints(edition, surah) {
  if (!/^[a-z]{2}\.[a-z]+$/.test(edition) || !Number.isInteger(surah) || surah < 1 || surah > 114) return [];
  if (edition === 'en.khattab') {
    return [
      { url: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/eng-mustafakhattaba/${surah}.json`, format: 'github' },
      { url: `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-mustafakhattaba/${surah}.json`, format: 'github' },
    ];
  }
  // The singular edition endpoint returns one object, not an array of editions.
  const endpoints = [{ url: `https://api.alquran.cloud/v1/surah/${surah}/${edition}`, format: 'alquran' }];
  const resource = QURAN_COM_EDITIONS[edition];
  if (resource) endpoints.push({ url: `https://api.quran.com/api/v4/quran/translations/${resource}?chapter_number=${surah}`, format: 'qurancom' });
  return endpoints;
}

module.exports = { getTranslationEndpoints, translationStorageKey };
