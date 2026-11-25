import React, { createContext, useContext } from 'react';
import { AppLanguage } from '../types/draft';
import { TRANSLATIONS, TranslationStrings } from './translations';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: TranslationStrings;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => undefined,
  t: TRANSLATIONS.en,
});

export const LanguageProvider: React.FC<{
  lang: AppLanguage;
  onChangeLang: (lang: AppLanguage) => void;
  children: React.ReactNode;
}> = ({ lang, onChangeLang, children }) => {
  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: onChangeLang,
        t: TRANSLATIONS[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext);
}
