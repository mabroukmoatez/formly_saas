import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Theme Toggle Component
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const { t } = useLanguage();

  const themes = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  const handleThemeChange = () => {
    const currentIndex = themes.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value as any);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeChange}
      className="flex items-center gap-2"
      title={t('theme.toggleTheme')}
    >
      <CurrentIcon className="w-4 h-4" />
      <span className="hidden sm:inline">{currentTheme.label}</span>
    </Button>
  );
};

/**
 * Language Switcher Component
 */
export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useLanguage();

  const languages = [
    { value: 'fr', label: t('language.french'), flag: '🇫🇷' },
    { value: 'en', label: t('language.english'), flag: '🇺🇸' },
  ] as const;

  const currentLang = languages.find(l => l.value === currentLanguage) || languages[0];

  const handleLanguageChange = () => {
    const currentIndex = languages.findIndex(l => l.value === currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].value as any);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLanguageChange}
      className="flex items-center gap-2"
      title={t('language.changeLanguage')}
    >
      <span className="text-lg">{currentLang.flag}</span>
      <span className="hidden sm:inline">{currentLang.label}</span>
    </Button>
  );
};

/**
 * Header Component with Theme and Language Controls
 */
export const AppHeader: React.FC = () => {
  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Formly LMS
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
