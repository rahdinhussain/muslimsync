import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n, { DEFAULT_LOCALE, getLanguage, LANGUAGE_STORAGE_KEY, normalizeLocale } from '../i18n';

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);
  const [needsChoice, setNeedsChoice] = useState(true);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      let stored = null;
      try { stored = normalizeLocale(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)); } catch { /* A picker lets the user retry a storage failure. */ }
      let suggested = DEFAULT_LOCALE;
      try {
        suggested = Localization.getLocales().map(({ languageTag }) => normalizeLocale(languageTag)).find(Boolean) || DEFAULT_LOCALE;
      } catch { /* A missing device locale is safe to ignore. */ }
      const language = stored || suggested;
      await i18n.changeLanguage(language);
      if (active) {
        setLocale(language);
        setNeedsChoice(!stored);
        setReady(true);
      }
    }
    hydrate();
    return () => { active = false; };
  }, []);

  async function chooseLanguage(language) {
    if (!getLanguage(language)) throw new Error('Unsupported interface language');
    // Do not claim persistence or dismiss onboarding if the write fails.
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
    setLocale(language);
    setNeedsChoice(false);
  }

  return (
    <LocaleContext.Provider value={{ locale, ready, needsChoice, chooseLanguage, isRTL: getLanguage(locale)?.direction === 'rtl' }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useAppLocale must be used within LocaleProvider');
  return value;
}
