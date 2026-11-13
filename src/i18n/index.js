import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/bn.js';
import '@formatjs/intl-pluralrules/locale-data/ar.js';
import '@formatjs/intl-pluralrules/locale-data/ur.js';
import registry from '../../i18n/languages.json';
import enCommon from '../../i18n/locales/en/common.json';
import bnCommon from '../../i18n/locales/bn/common.json';
import arCommon from '../../i18n/locales/ar/common.json';
import urCommon from '../../i18n/locales/ur/common.json';
import enMobile from '../../i18n/locales/en/mobile.json';
import bnMobile from '../../i18n/locales/bn/mobile.json';
import arMobile from '../../i18n/locales/ar/mobile.json';
import urMobile from '../../i18n/locales/ur/mobile.json';

export const LANGUAGES = registry.languages;
export const DEFAULT_LOCALE = registry.defaultLocale;
export const LANGUAGE_STORAGE_KEY = '@muslim_sync_language_v1';
export const getLanguage = (locale) => LANGUAGES.find((language) => language.code === locale);
export const normalizeLocale = (locale) => {
  if (typeof locale !== 'string') return null;
  const code = locale.trim().toLowerCase().split(/[-_]/)[0];
  return getLanguage(code) ? code : null;
};

// Every supported UI language is bundled, including the first-launch picker.
// No network service or account is needed to choose or display a language.
i18next.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, mobile: enMobile },
    bn: { common: bnCommon, mobile: bnMobile },
    ar: { common: arCommon, mobile: arMobile },
    ur: { common: urCommon, mobile: urMobile },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: LANGUAGES.map(({ code }) => code),
  defaultNS: 'mobile',
  ns: ['common', 'mobile'],
  initImmediate: false,
  returnEmptyString: false,
  interpolation: {
    escapeValue: false,
    alwaysFormat: true,
    format: (value, _format, language) => typeof value === 'number'
      ? new Intl.NumberFormat(getLanguage(normalizeLocale(language))?.intlLocale || 'en').format(value)
      : value,
  },
  react: { useSuspense: false },
});

export default i18next;
export const tr = (key, options = {}) => i18next.t(key, options);
export const currentLocale = () => normalizeLocale(i18next.resolvedLanguage || i18next.language) || DEFAULT_LOCALE;
export const intlLocale = (locale = currentLocale()) => getLanguage(locale)?.intlLocale || 'en';
export const formatNumber = (value, options = {}) => new Intl.NumberFormat(intlLocale(), options).format(value);
export const formatDate = (value, options = {}) => new Intl.DateTimeFormat(intlLocale(), options).format(value);
export const prayerLabel = (id) => tr(`prayers.${String(id).toLowerCase()}`, { ns: 'common', defaultValue: id });

// Translate only the displayed value. API keys, stored times and calculations
// continue to use their original language-independent representation.
export function formatPrayerTime(value) {
  if (!value || value === '--:--') return value || '--:--';
  const match = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return value;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3]) hours = (hours % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  if (hours > 23 || minutes > 59) return value;
  const date = new Date(2000, 0, 1, hours, minutes);
  return formatDate(date, { hour: 'numeric', minute: '2-digit' });
}
