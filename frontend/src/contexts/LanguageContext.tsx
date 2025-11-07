import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CONFIG, Language } from '../config/constants';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(CONFIG.DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Change language
   */
  const setLanguage = async (language: Language): Promise<void> => {
    try {
      setIsLoading(true);
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Store language preference
      localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, language);
      
      // Update document language attribute
      document.documentElement.lang = language;
      
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize language context
   */
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        setIsLoading(true);
        
        // Get stored language preference
        const storedLanguage = localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE) as Language;
        
        if (storedLanguage && Object.values(CONFIG.LANGUAGES).includes(storedLanguage)) {
          await i18n.changeLanguage(storedLanguage);
          setCurrentLanguage(storedLanguage);
        } else {
          // Use browser language if available, otherwise default
          const browserLanguage = navigator.language.split('-')[0];
          const supportedLanguage = Object.values(CONFIG.LANGUAGES).includes(browserLanguage as Language) 
            ? browserLanguage as Language 
            : CONFIG.DEFAULT_LANGUAGE;
          
          await i18n.changeLanguage(supportedLanguage);
          setCurrentLanguage(supportedLanguage);
          localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, supportedLanguage);
        }
        
        // Set document language attribute
        document.documentElement.lang = i18n.language;
        
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to default language
        await i18n.changeLanguage(CONFIG.DEFAULT_LANGUAGE);
        setCurrentLanguage(CONFIG.DEFAULT_LANGUAGE);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [i18n]);

  /**
   * Listen for language changes
   */
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng as Language);
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use language context
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
