// =============================================================================
//  ThemeProvider — vanilla React Context. Drop-in replacement for Tamagui's
//  TamaguiThemeProvider. Mirrors design-handoff/01-tokens/ThemeProvider.tsx.
// =============================================================================

import * as React from "react";
import { useColorScheme } from "react-native";
import {
  SOVEREIGN,
  SOLARPUNK,
  DEFAULT_THEME,
  type Theme,
  type ThemeName,
} from "./tokens";

/**
 * User-facing theme choice. "system" follows the OS color scheme; the two
 * named values pin an explicit override. Persisted as-is in localStorage —
 * a previously stored bare ThemeName is still valid (its meaning matches
 * the explicit-override case).
 */
export type ThemeMode = "system" | ThemeName;

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const PERSIST_KEY = "@arcnode/theme";

interface WebGlobals {
  localStorage?: { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void };
  document?: { documentElement: { setAttribute: (name: string, value: string) => void } };
}

/**
 * Access web-only globals (`window.localStorage`, `document`) via globalThis so
 * the same module compiles on both web (DOM) and React Native (no DOM).
 * @returns Whichever subset of web globals exists in the current runtime
 */
function webGlobals(): WebGlobals {
  const g = globalThis as unknown as {
    window?: { localStorage?: WebGlobals["localStorage"] };
    document?: WebGlobals["document"];
  };
  return {
    localStorage: g.window?.localStorage,
    document: g.document,
  };
}

/**
 * Read the user's persisted theme mode. Returns null when nothing is stored
 * (caller treats as "system").
 * @returns Persisted mode or null
 */
function readPersistedMode(): ThemeMode | null {
  const v = webGlobals().localStorage?.getItem(PERSIST_KEY);
  if (v === "sovereign" || v === "solarpunk" || v === "system") return v;
  return null;
}

/**
 * Map OS color scheme to a theme. Dark → Sovereign, light → Solarpunk.
 * `null` (RN hasn't reported yet) falls through to DEFAULT_THEME at the caller.
 * @param scheme RN useColorScheme() return value
 * @returns Theme name or null
 */
function themeFromScheme(
  scheme: "light" | "dark" | null | undefined,
): ThemeName | null {
  if (scheme === "dark") return "sovereign";
  if (scheme === "light") return "solarpunk";
  return null;
}

/**
 * Resolve mode + OS scheme into a concrete ThemeName.
 */
function resolveThemeName(
  mode: ThemeMode,
  scheme: "light" | "dark" | null | undefined,
): ThemeName {
  if (mode === "system") return themeFromScheme(scheme) ?? DEFAULT_THEME;
  return mode;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Override initial theme — useful for storybook / playwright. */
  initialTheme?: ThemeName;
}

/**
 * React provider that holds active theme + persists choice to localStorage.
 * Also reflects the active name on `<html data-theme="...">` so CSS-var-only
 * consumers (print PDFs, marketing emails) pick up the swap.
 * @param props Provider props
 * @param props.children Subtree that gets access via useTheme() / useThemeControl()
 * @param props.initialTheme Optional override of the persisted theme
 * @returns Context provider element
 */
export function ThemeProvider({
  children,
  initialTheme,
}: ThemeProviderProps): React.ReactElement {
  const osScheme = useColorScheme();
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(() => {
    if (initialTheme) return initialTheme;
    return readPersistedMode() ?? "system";
  });

  const themeName = resolveThemeName(themeMode, osScheme);

  const setThemeMode = React.useCallback((mode: ThemeMode): void => {
    setThemeModeState(mode);
    const { localStorage } = webGlobals();
    localStorage?.setItem(PERSIST_KEY, mode);
  }, []);

  React.useEffect(() => {
    webGlobals().document?.documentElement.setAttribute(
      "data-theme",
      themeName,
    );
  }, [themeName]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme: themeName === "sovereign" ? SOVEREIGN : SOLARPUNK,
      themeName,
      themeMode,
      setThemeMode,
    }),
    [themeName, themeMode, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Returns the active Theme object. Throws if used outside ThemeProvider.
 * @returns Active Theme
 * @throws Error if invoked outside a ThemeProvider
 */
export function useTheme(): Theme {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx.theme;
}

/**
 * Returns the resolved theme name, the user-facing mode, and the mode
 * setter. Use for theme switchers.
 * @returns themeName + themeMode + setThemeMode
 * @throws Error if invoked outside a ThemeProvider
 */
export function useThemeControl(): Omit<ThemeContextValue, "theme"> {
  const ctx = React.useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeControl must be used inside <ThemeProvider>");
  return {
    themeName: ctx.themeName,
    themeMode: ctx.themeMode,
    setThemeMode: ctx.setThemeMode,
  };
}
