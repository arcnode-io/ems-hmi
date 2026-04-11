import { createFont } from "@tamagui/core";

/**
 * Body font for general text.
 * Space Grotesk - bold geometric sans for neobrutalism theme.
 */
export const bodyFont = createFont({
  family: "SpaceGrotesk",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    4: 24,
    5: 28,
    6: 32,
    true: 22,
  },
  weight: {
    4: "400",
    5: "500",
    7: "700",
    true: "400",
  },
  letterSpacing: {
    4: 0,
  },
  // Android uses filename as font family - map weights to filenames
  face: {
    400: { normal: "SpaceGrotesk-Regular" },
    500: { normal: "SpaceGrotesk-Medium" },
    700: { normal: "SpaceGrotesk-Bold" },
  },
});

/**
 * Monospace font for code snippets.
 * JetBrains Mono - modern monospace with programming ligatures.
 *
 * NOTE: Tamagui fonts are global (config-level), not per-theme.
 * Theme string values don't resolve for fontFamily - use $mono token reference.
 * Per-theme fonts would require switching font tokens dynamically, not theme values.
 */
export const monoFont = createFont({
  family: "JetBrainsMono",
  size: {
    1: 12,
    2: 14,
    3: 16,
    true: 14,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    true: 18,
  },
  weight: {
    4: "400",
    5: "500",
    7: "700",
    true: "400",
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    400: { normal: "JetBrainsMono-Regular" },
    500: { normal: "JetBrainsMono-Medium" },
    700: { normal: "JetBrainsMono-Bold" },
  },
});

/**
 * JetBrains Mono for darkmode theme.
 * Modern monospace with programming ligatures.
 */
export const jetbrainsMonoFont = createFont({
  family: "JetBrainsMono",
  size: {
    1: 12,
    2: 14,
    3: 16,
    true: 14,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    true: 18,
  },
  weight: {
    4: "400",
    5: "500",
    7: "700",
    true: "400",
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    400: { normal: "JetBrainsMono-Regular" },
    500: { normal: "JetBrainsMono-Medium" },
    700: { normal: "JetBrainsMono-Bold" },
  },
});

/**
 * Exo2 font for darkmode theme.
 * Geometric sans-serif with a futuristic feel.
 */
export const exo2Font = createFont({
  family: "Exo2",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    4: 24,
    5: 28,
    6: 32,
    true: 22,
  },
  weight: {
    4: "400",
    5: "500",
    7: "700",
    true: "400",
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    400: { normal: "Exo2-Regular" },
    500: { normal: "Exo2-Medium" },
    700: { normal: "Exo2-Bold" },
  },
});

/**
 * Inter font for neomorphism theme.
 * Clean, modern sans-serif.
 */
export const interFont = createFont({
  family: "Inter",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    4: 24,
    5: 28,
    6: 32,
    true: 22,
  },
  weight: {
    4: "400",
    5: "500",
    7: "700",
    true: "400",
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    400: { normal: "Inter-Regular" },
    500: { normal: "Inter-Medium" },
    700: { normal: "Inter-Bold" },
  },
});

export const fonts = {
  body: bodyFont,
  mono: monoFont,
  heading: bodyFont,
  inter: interFont,
  exo2: exo2Font,
  jetbrainsMono: jetbrainsMonoFont,
} as const;
