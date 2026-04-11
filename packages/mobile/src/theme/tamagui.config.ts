import { createTamagui } from "@tamagui/core";
import { createAnimations } from "@tamagui/animations-css";
import { tokens } from "./tamagui.tokens";
import { themes } from "./tamagui.themes";
import { fonts } from "./tamagui.fonts";

const animations = createAnimations({
  fast: "ease-in 150ms",
  medium: "ease-in 300ms",
  slow: "ease-in 450ms",
  bouncy: "ease-in-out 300ms",
});

/**
 * Shorthand property mappings for convenience.
 */
const SHORTHANDS = {
  px: "paddingHorizontal",
  py: "paddingVertical",
  mx: "marginHorizontal",
  my: "marginVertical",
  bg: "backgroundColor",
  br: "borderRadius",
  bw: "borderWidth",
  bc: "borderColor",
} as const;

/**
 * Media query breakpoints for responsive styling.
 */
const MEDIA = {
  xs: { maxWidth: 660 },
  sm: { maxWidth: 800 },
  md: { maxWidth: 1020 },
  lg: { maxWidth: 1280 },
  gtXs: { minWidth: 661 },
  gtSm: { minWidth: 801 },
  gtMd: { minWidth: 1021 },
  gtLg: { minWidth: 1281 },
} as const;

export const config = createTamagui({
  tokens,
  themes,
  fonts,
  animations,
  defaultFont: "body",
  media: MEDIA,
  shorthands: SHORTHANDS,
});

type AppConfig = typeof config;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
