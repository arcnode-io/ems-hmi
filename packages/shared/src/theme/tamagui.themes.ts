import { THEME_NAME, type ThemeName } from "./theme.types";
import { parseDimension } from "./dtcg.utils";
import neobrutalism from "./tokens/neobrutalism.json";
import neomorphism from "./tokens/neomorphism.json";
import glassmorphism from "./tokens/glassmorphism.json";
import darkmode from "./tokens/darkmode.json";
import liquidglass from "./tokens/liquidglass.json";

interface DTCGToken<T = string> {
  $value: T;
}

interface DTCGShadowValue {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  color: string;
}

interface DTCGThemeTokens {
  color: {
    background: DTCGToken;
    text: DTCGToken;
    textMuted: DTCGToken;
    surface: DTCGToken;
    border: DTCGToken;
    primary: DTCGToken;
    secondary: DTCGToken;
    accent: DTCGToken;
    error: DTCGToken;
  };
  fontFamily: {
    primary: DTCGToken;
  };
  shadow?: {
    $type?: string;
    $description?: string;
    default?: DTCGToken<DTCGShadowValue>;
    hover?: DTCGToken<DTCGShadowValue>;
    raisedLight?: DTCGToken<DTCGShadowValue>;
    raisedDark?: DTCGToken<DTCGShadowValue>;
  };
  borderWidth?: {
    $type?: string;
    default?: DTCGToken;
    input?: DTCGToken;
  };
  borderRadius?: {
    $type?: string;
    none?: DTCGToken;
    sm?: DTCGToken;
  };
}

interface TamaguiTheme {
  [key: string]: string | number;
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
  // Card shadow (CSS boxShadow string - supports dual shadows)
  cardBoxShadow: string;
  // Button shadow (CSS boxShadow string)
  buttonBoxShadow: string;
  cardBorderWidth: number;
  cardBorderRadius: number;
  inputBorderWidth: number;
}

/** Default shadow values when theme doesn't define shadow tokens. */
const DEFAULT_SHADOW: DTCGShadowValue = {
  offsetX: "0px",
  offsetY: "0px",
  blur: "0px",
  spread: "0px",
  color: "transparent",
};

/** Shadow strings for card and button. */
interface ShadowPair {
  cardBoxShadow: string;
  buttonBoxShadow: string;
}

/**
 * Builds a CSS boxShadow string from shadow values.
 * @param shadow - Shadow token values.
 * @returns CSS boxShadow string.
 */
function buildShadowString(shadow: DTCGShadowValue): string {
  return `${shadow.offsetX} ${shadow.offsetY} ${shadow.blur} ${shadow.spread} ${shadow.color}`;
}

/**
 * Builds dual shadow (neomorphism style) for card and button.
 * @param light - Light shadow values.
 * @param dark - Dark shadow values.
 * @returns Shadow pair with card and button shadows.
 */
function buildDualShadows(
  light: DTCGShadowValue,
  dark: DTCGShadowValue,
): ShadowPair {
  const cardBoxShadow = `${buildShadowString(light)}, ${buildShadowString(
    dark,
  )}`;
  const buttonLight = { ...light, offsetX: "-3px", offsetY: "-3px" };
  const buttonDark = { ...dark, offsetX: "3px", offsetY: "3px" };
  const buttonBoxShadow = `${buildShadowString(
    buttonLight,
  )}, ${buildShadowString(buttonDark)}`;
  return { cardBoxShadow, buttonBoxShadow };
}

/**
 * Builds single shadow (neobrutalism style) for card and button.
 * @param base - Base shadow values.
 * @returns Shadow pair with card and button shadows.
 */
function buildSingleShadows(base: DTCGShadowValue): ShadowPair {
  const baseOffset = parseDimension(base.offsetX);
  const cardOffset = baseOffset + 2;
  const buttonOffset = baseOffset + 1;
  return {
    cardBoxShadow: `${cardOffset}px ${cardOffset}px ${base.blur} 0px ${base.color}`,
    buttonBoxShadow: `${buttonOffset}px ${buttonOffset}px ${base.blur} 0px ${base.color}`,
  };
}

/**
 * Extracts shadow pair from DTCG tokens.
 * @param shadow - Optional shadow tokens from theme.
 * @returns Shadow pair for card and button.
 */
function extractShadows(shadow: DTCGThemeTokens["shadow"]): ShadowPair {
  const baseShadow = shadow?.default?.$value ?? DEFAULT_SHADOW;
  const raisedLight = shadow?.raisedLight?.$value;
  const raisedDark = shadow?.raisedDark?.$value;

  if (raisedLight && raisedDark) {
    return buildDualShadows(raisedLight, raisedDark);
  }
  return buildSingleShadows(baseShadow);
}

/**
 * Creates a Tamagui theme from DTCG token structure.
 * @param tokens - DTCG-compliant theme tokens.
 * @returns Tamagui theme object.
 */
function createThemeFromDTCG(tokens: DTCGThemeTokens): TamaguiTheme {
  const { cardBoxShadow, buttonBoxShadow } = extractShadows(tokens.shadow);

  return {
    background: tokens.color.background.$value,
    color: tokens.color.text.$value,
    colorSecondary: tokens.color.textMuted.$value,
    surface: tokens.color.surface.$value,
    borderColor: tokens.color.border.$value,
    primary: tokens.color.primary.$value,
    secondary: tokens.color.secondary.$value,
    accent: tokens.color.accent.$value,
    error: tokens.color.error.$value,
    fontFamily: `${tokens.fontFamily.primary.$value}-Regular`,
    cardBoxShadow,
    buttonBoxShadow,
    cardBorderWidth: parseDimension(
      tokens.borderWidth?.default?.$value ?? "0px",
    ),
    cardBorderRadius: parseDimension(tokens.borderRadius?.sm?.$value ?? "0px"),
    inputBorderWidth: parseDimension(
      tokens.borderWidth?.input?.$value ?? "1px",
    ),
  };
}

/** Map of theme names to their DTCG token files. */
const THEME_TOKEN_MAP: Record<ThemeName, DTCGThemeTokens> = {
  [THEME_NAME.NEOBRUTALISM]: neobrutalism,
  [THEME_NAME.NEOMORPHISM]: neomorphism,
  [THEME_NAME.GLASSMORPHISM]: glassmorphism,
  [THEME_NAME.DARKMODE]: darkmode,
  [THEME_NAME.LIQUIDGLASS]: liquidglass,
};

/** Generated themes from DTCG tokens. */
const generatedThemes = Object.fromEntries(
  Object.entries(THEME_TOKEN_MAP).map(([name, tokens]) => [
    name,
    createThemeFromDTCG(tokens),
  ]),
) as Record<ThemeName, ReturnType<typeof createThemeFromDTCG>>;

/**
 * All available themes keyed by theme name.
 * "light" and "dark" are Tamagui conventions for system theme support.
 */
export const themes = {
  light: generatedThemes[THEME_NAME.NEOBRUTALISM],
  dark: generatedThemes[THEME_NAME.DARKMODE],
  ...generatedThemes,
} as const;
