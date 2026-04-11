import { useTheme, useThemeName } from "@tamagui/core";

/**
 * Theme values extracted from Tamagui's proxied theme object.
 * Provides direct access without .val indirection.
 */
export interface ThemeValues {
  background: string;
  color: string;
  colorSecondary: string;
  surface: string;
  borderColor: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  fontFamily: string;
  cardBoxShadow: string;
  buttonBoxShadow: string;
  cardBorderWidth: number;
  cardBorderRadius: number;
  inputBorderWidth: number;
}

/** Tamagui proxied theme token with .val accessor. */
interface ThemeToken<T> {
  val: T;
}

/** Our theme shape with required properties. */
interface TypedTheme {
  background: ThemeToken<string>;
  color: ThemeToken<string>;
  colorSecondary: ThemeToken<string>;
  surface: ThemeToken<string>;
  borderColor: ThemeToken<string>;
  primary: ThemeToken<string>;
  secondary: ThemeToken<string>;
  accent: ThemeToken<string>;
  error: ThemeToken<string>;
  fontFamily: ThemeToken<string>;
  cardBoxShadow: ThemeToken<string>;
  buttonBoxShadow: ThemeToken<string>;
  cardBorderWidth: ThemeToken<number>;
  cardBorderRadius: ThemeToken<number>;
  inputBorderWidth: ThemeToken<number>;
}

/**
 * Returns current theme values as plain types.
 * Wraps Tamagui's useTheme() to extract .val from proxied values.
 * Subscribes to theme changes via useThemeName().
 * @returns ThemeValues with extracted values from Tamagui theme proxy.
 */
export function useCurrentTheme(): ThemeValues {
  useThemeName();
  const theme = useTheme() as unknown as TypedTheme;

  return {
    background: theme.background.val,
    color: theme.color.val,
    colorSecondary: theme.colorSecondary.val,
    surface: theme.surface.val,
    borderColor: theme.borderColor.val,
    primary: theme.primary.val,
    secondary: theme.secondary.val,
    accent: theme.accent.val,
    error: theme.error.val,
    fontFamily: theme.fontFamily.val,
    cardBoxShadow: theme.cardBoxShadow.val,
    buttonBoxShadow: theme.buttonBoxShadow.val,
    cardBorderWidth: theme.cardBorderWidth.val,
    cardBorderRadius: theme.cardBorderRadius.val,
    inputBorderWidth: theme.inputBorderWidth.val,
  };
}
