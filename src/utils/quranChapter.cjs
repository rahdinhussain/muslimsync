const { getTranslationEndpoints } = require('../i18n/quran-sources.cjs');

function validate(rows, count) {
  return Array.isArray(rows) && rows.length === count && rows.every((v, i) =>
    v?.number === i + 1 && typeof v.text === 'string' && v.text.trim());
}
async function fetchChapter(surah, edition = null, signal, request = fetch) {
  const n = surah.number;
  const endpoints = edition ? getTranslationEndpoints(edition, n) : [
    {format: 'qurancom', url: 'https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=' + n},
    {format: 'alquran', url: 'https://api.alquran.cloud/v1/surah/' + n + '/quran-uthmani'},
    {format: 'github', url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmani/' + n + '.json'}
  ];
  for (const {format, url} of endpoints) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) throw Error('Cancelled');
    signal?.addEventListener('abort', abort);
    const timer = setTimeout(abort, 12000);
    try {
      const response = await request(url, {signal: controller.signal, headers: {Accept: 'application/json'}});
      if (!response.ok) continue;
      const data = await response.json();
      let list;
      if (format === 'alquran') {
        if (data.data?.number !== n || data.data?.edition?.identifier !== (edition || 'quran-uthmani')) continue;
        list = data.data.ayahs;
      } else if (format === 'github') list = data.chapter || data;
      else list = edition ? data.translations : data.verses;
      if (!Array.isArray(list) || list.length !== surah.ayahs) continue;
      if (list.some(row => (row.verse_key && Number(row.verse_key.split(':')[0]) !== n) || (row.chapter && Number(row.chapter) !== n))) continue;
      const verses = list.map((row, i) => ({
        number: Number(row.numberInSurah || row.verse_key?.split(':')[1] || row.verse_number || row.verse || i + 1),
        text: String(row.text_uthmani || row.text || '').trim()
      }));
      if (!controller.signal.aborted && validate(verses, surah.ayahs)) return verses;
    } catch { /* Try the next provider for the same text and edition. */ }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  throw Error('Chapter unavailable');
}
module.exports = { validate, fetchChapter };
