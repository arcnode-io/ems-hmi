import { useState, useCallback, createContext, useContext } from "react";
import type { ReactNode, ReactElement } from "react";
import { TamaguiProvider } from "@tamagui/core";
import { PortalProvider } from "@tamagui/portal";
import config from "./tamagui.config";
import { THEME_NAME, type ThemeName } from "./theme.types";

interface ThemeSwitcherContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeSwitcherContext = createContext<ThemeSwitcherContextValue | null>(
  null,
);

interface TamaguiThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
}

/**
 * Theme provider with theme switching capability.
 * @param props Component props
 * @param props.children Child components
 * @param props.initialTheme Initial theme (defaults to neobrutalism)
 * @returns React element with Tamagui and theme switcher context
 */
export function TamaguiThemeProvider({
  children,
  initialTheme = THEME_NAME.NEOBRUTALISM,
}: TamaguiThemeProviderProps): ReactElement {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeSwitcherContext.Provider value={{ theme, setTheme }}>
      <TamaguiProvider config={config} defaultTheme={theme}>
        <PortalProvider>{children}</PortalProvider>
      </TamaguiProvider>
    </ThemeSwitcherContext.Provider>
  );
}

/**
 * Hook to access theme switching functionality.
 * @returns Current theme and setTheme function
 * @throws Error if used outside TamaguiThemeProvider
 */
export function useThemeSwitcher(): ThemeSwitcherContextValue {
  const context = useContext(ThemeSwitcherContext);
  if (!context) {
    throw new Error(
      "useThemeSwitcher must be used within TamaguiThemeProvider",
    );
  }
  return context;
}
