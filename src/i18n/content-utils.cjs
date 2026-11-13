const SUPPORTED = new Set(['en', 'bn', 'ar', 'ur']);
const textPrefix = (locale) => {
  if (!SUPPORTED.has(locale)) throw new Error('Unsupported content locale');
  return `@dua_downloaded_text_v2_${locale}_`;
};
const duaTextKey = (id, locale) => `${textPrefix(locale)}${String(id)}`;

function mergeDuaTranslation(dua, translation, locale) {
  const approved = translation?.reviewed === true && translation.locale === locale && typeof translation.translation === 'string' && translation.translation.trim() && translation.source;
  return {
    id: dua.id,
    title: approved && translation.title ? translation.title : dua.name,
    arabic: dua.arabic_text,
    transliteration: approved && translation.transliteration ? translation.transliteration : dua.transliteration || '',
    translation: approved ? translation.translation : dua.translation || '',
    reference: dua.reference || '',
    audioUrl: dua.audio_url,
    audioUrlFallback: dua.audio_url_fallback,
    category_id: dua.category_id,
    requestedLocale: locale,
    contentLanguage: approved ? locale : 'en',
    translationSource: approved ? translation.source : null,
    translationUpdatedAt: approved ? translation.updated_at : null,
  };
}

module.exports = { textPrefix, duaTextKey, mergeDuaTranslation };
