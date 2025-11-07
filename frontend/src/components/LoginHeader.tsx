import React from 'react';
import { Sun, Moon, Monitor, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Login Page Header with Theme and Language Controls
 */
export const LoginHeader: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();

  const themes = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') },
  ] as const;

  const languages = [
    { value: 'fr', label: t('language.french'), flag: '🇫🇷' },
    { value: 'en', label: t('language.english'), flag: '🇺🇸' },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const currentLang = languages.find(l => l.value === currentLanguage) || languages[0];
  const CurrentThemeIcon = currentTheme.icon;

  const handleThemeChange = () => {
    const currentIndex = themes.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value as any);
  };

  const handleLanguageChange = () => {
    const currentIndex = languages.findIndex(l => l.value === currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].value as any);
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {/* Language Switcher */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLanguageChange}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
        title={t('language.changeLanguage')}
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">{currentLang.label}</span>
      </Button>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleThemeChange}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
        title={t('theme.toggleTheme')}
      >
        <CurrentThemeIcon className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-medium">{currentTheme.label}</span>
      </Button>
    </div>
  );
};
