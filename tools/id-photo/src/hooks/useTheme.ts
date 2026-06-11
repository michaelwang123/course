import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const MANUAL_OVERRIDE_KEY = 'theme-manual';

/**
 * Theme hook with system preference detection and manual toggle.
 * 
 * Behavior:
 * - On first load: uses system preference (prefers-color-scheme)
 * - After manual toggle: uses stored preference, stops following system
 * - "Reset to system" clears manual override and re-follows system
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const isManual = localStorage.getItem(MANUAL_OVERRIDE_KEY) === 'true';
    if (isManual) {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    // Follow system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [isManualOverride, setIsManualOverride] = useState<boolean>(
    () => localStorage.getItem(MANUAL_OVERRIDE_KEY) === 'true'
  );

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system preference changes (only when not manually overridden)
  useEffect(() => {
    if (isManualOverride) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isManualOverride]);

  const toggleTheme = useCallback(() => {
    setIsManualOverride(true);
    localStorage.setItem(MANUAL_OVERRIDE_KEY, 'true');
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
