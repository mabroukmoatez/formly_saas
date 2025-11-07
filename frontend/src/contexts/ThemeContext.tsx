import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CONFIG, Theme } from '../config/constants';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(CONFIG.DEFAULT_THEME);
  const [isDark, setIsDark] = useState(false);

  /**
   * Apply theme to document
   */
  const applyTheme = (themeValue: Theme): void => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    let actualTheme: 'light' | 'dark';
    
    if (themeValue === 'system') {
      // Use system preference
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      actualTheme = themeValue;
    }
    
    // Apply theme class
    root.classList.add(actualTheme);
    root.setAttribute('data-theme', actualTheme);
    
    // Update state
    setIsDark(actualTheme === 'dark');
    
    // Store theme preference
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, themeValue);
  };

  /**
   * Set theme
   */
  const handleSetTheme = (newTheme: Theme): void => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = (): void => {
    const newTheme = isDark ? 'light' : 'dark';
    handleSetTheme(newTheme);
  };

  /**
   * Initialize theme
   */
  useEffect(() => {
    const initializeTheme = (): void => {
      // Get stored theme preference
      const storedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) as Theme;
      
      if (storedTheme && Object.values(CONFIG.THEMES).includes(storedTheme)) {
        setTheme(storedTheme);
        applyTheme(storedTheme);
      } else {
        // Use system preference as default
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = systemPrefersDark ? 'dark' : 'light';
        setTheme(defaultTheme);
        applyTheme(defaultTheme);
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, defaultTheme);
      }
    };

    initializeTheme();
  }, []);

  /**
   * Listen for system theme changes when theme is set to 'system'
   */
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
