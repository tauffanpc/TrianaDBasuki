import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../i18n';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], variables?: { count?: number }) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set default to 'en' (English) as requested by user
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_language') as Language;
      if (saved && ['en', 'id', 'zh'].includes(saved)) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.error('Error loading language from local storage', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: keyof typeof translations['en'], variables?: { count?: number }) => {
    const translationSet = translations[language] || translations['en'];
    let result = translationSet[key] || translations['en'][key] || key;
    
    if (variables && variables.count !== undefined) {
      result = result.replace('{{count}}', variables.count.toString());
    }
    
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
