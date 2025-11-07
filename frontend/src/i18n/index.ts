import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { CONFIG } from '../config/constants';

// Import translation files
import frTranslations from '../locales/fr';
import enTranslations from '../locales/en';

// Configure i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Default language
    lng: CONFIG.DEFAULT_LANGUAGE,
    
    // Fallback language
    fallbackLng: CONFIG.DEFAULT_LANGUAGE,
    
    // Supported languages
    supportedLngs: [CONFIG.LANGUAGES.FR, CONFIG.LANGUAGES.EN],
    
    // Namespaces
    ns: ['common'],
    defaultNS: 'common',
    
    // Resources
    resources: {
      [CONFIG.LANGUAGES.FR]: {
        common: frTranslations,
      },
      [CONFIG.LANGUAGES.EN]: {
        common: enTranslations,
      },
    },
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: CONFIG.STORAGE_KEYS.LANGUAGE,
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Debug mode (set to false in production)
    debug: process.env.NODE_ENV === 'development',
    
    // React options
    react: {
      useSuspense: false,
    },
  });

export default i18n;
