import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light'); // Start with light theme to prevent flash
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Priority: Database theme > localStorage theme > default light
    if (isInitialized) {
      if (user?.settings?.theme) {
        // Use database theme if available
        const userTheme = user.settings.theme as Theme;
        if (['light', 'dark', 'system'].includes(userTheme)) {
          setTheme(userTheme);
          setIsThemeLoaded(true);
          return;
        }
      }
      
      // Fallback to localStorage theme if no database theme
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
      setIsThemeLoaded(true);
    }
  }, [user, isInitialized]);

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme]);

  useEffect(() => {
    // Only apply theme changes after initial load to prevent flash
    if (isThemeLoaded) {
      // Apply theme to document
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
      
      // Save theme preference to localStorage
      localStorage.setItem('theme', theme);
      
      // Save theme preference to backend
      saveThemePreference(theme);
    }
  }, [theme, actualTheme, isThemeLoaded]);

  const saveThemePreference = async (newTheme: Theme) => {
    // Only save to backend if user is authenticated
    if (!user) {
      return;
    }
    
    try {
      await fetch('/api/auth/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          settings: {
            theme: newTheme,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
