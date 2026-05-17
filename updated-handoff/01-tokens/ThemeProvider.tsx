// =============================================================================
//  ThemeProvider — vanilla React Context. Drop-in replacement for Tamagui's
//  TamaguiThemeProvider. ~30 lines, no deps.
// =============================================================================

import * as React from 'react';
import { SOVEREIGN, SOLARPUNK, DEFAULT_THEME, type Theme, type ThemeName } from './tokens';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const PERSIST_KEY = '@arcnode/theme';

/** Read persisted theme on mount; fall back to DEFAULT_THEME. */
function readPersistedTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const v = window.localStorage?.getItem(PERSIST_KEY);
  return v === 'sovereign' || v === 'solarpunk' ? v : DEFAULT_THEME;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Override initial theme — useful for storybook / playwright. */
  initialTheme?: ThemeName;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [themeName, setThemeName] = React.useState<ThemeName>(
    initialTheme ?? readPersistedTheme(),
  );

  const setTheme = React.useCallback((name: ThemeName) => {
    setThemeName(name);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(PERSIST_KEY, name);
      // Also reflect on the html element so CSS-var-only consumers
      // (print PDF, marketing emails) pick up the swap.
      document.documentElement.setAttribute('data-theme', name);
    }
  }, []);

  // Set the data-theme attr on mount so non-React CSS still gets a theme.
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeName);
    }
  }, [themeName]);

  const value = React.useMemo(
    () => ({
      theme: themeName === 'sovereign' ? SOVEREIGN : SOLARPUNK,
      themeName,
      setTheme,
    }),
    [themeName, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Returns the active Theme object. Throws if used outside ThemeProvider. */
export function useTheme(): Theme {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

/** Returns the active theme name + setter. Use for theme switchers. */
export function useThemeControl(): Omit<ThemeContextValue, 'theme'> {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControl must be used inside <ThemeProvider>');
  return { themeName: ctx.themeName, setTheme: ctx.setTheme };
}
