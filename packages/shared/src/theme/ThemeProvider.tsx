// =============================================================================
//  ThemeProvider — vanilla React Context. Drop-in replacement for Tamagui's
//  TamaguiThemeProvider. Mirrors handoff/01-tokens/ThemeProvider.tsx.
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

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
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
 * Read the user's persisted theme choice. Returns null if they've never picked
 * one — caller falls back to OS scheme or DEFAULT_THEME.
 * @returns Persisted theme name or null
 */
function readPersistedTheme(): ThemeName | null {
  const v = webGlobals().localStorage?.getItem(PERSIST_KEY);
  return v === "sovereign" || v === "solarpunk" ? v : null;
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
  // Track whether the user has explicitly chosen a theme. If they have, their
  // pick wins over OS scheme changes; if they haven't, follow the OS.
  const [hasUserChoice, setHasUserChoice] = React.useState<boolean>(() =>
    readPersistedTheme() !== null,
  );
  const [themeName, setThemeName] = React.useState<ThemeName>(
    () =>
      initialTheme ??
      readPersistedTheme() ??
      themeFromScheme(osScheme) ??
      DEFAULT_THEME,
  );

  // Follow OS scheme changes only when user hasn't pinned a choice.
  React.useEffect(() => {
    if (hasUserChoice) return;
    const fromOs = themeFromScheme(osScheme);
    if (fromOs && fromOs !== themeName) setThemeName(fromOs);
  }, [osScheme, hasUserChoice, themeName]);

  const setTheme = React.useCallback((name: ThemeName): void => {
    setThemeName(name);
    setHasUserChoice(true);
    const { localStorage, document } = webGlobals();
    localStorage?.setItem(PERSIST_KEY, name);
    document?.documentElement.setAttribute("data-theme", name);
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
      setTheme,
    }),
    [themeName, setTheme],
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
 * Returns the active theme name + setter. Use for theme switchers.
 * @returns themeName + setTheme
 * @throws Error if invoked outside a ThemeProvider
 */
export function useThemeControl(): Omit<ThemeContextValue, "theme"> {
  const ctx = React.useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeControl must be used inside <ThemeProvider>");
  return { themeName: ctx.themeName, setTheme: ctx.setTheme };
}
