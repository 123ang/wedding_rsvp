import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, translate } from '../i18n/mobileTranslations';

const STORAGE_KEY = '@wedding_language';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, vars) => translate('en', key, vars),
  languages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGUAGES[saved]) {
          setLanguageState(saved);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const setLanguage = async (lang) => {
    if (!SUPPORTED_LANGUAGES[lang]) return;
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const value = {
    language,
    setLanguage,
    t: (key, vars) => translate(language, key, vars),
    languages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


