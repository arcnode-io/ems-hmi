import { createTokens } from "@tamagui/core";
import { parseDimensionGroup } from "./dtcg.utils";
import baseTokens from "./tokens/base.json";

/**
 * Parse spacing tokens from DTCG base tokens.
 */
const SPACE_TOKENS = {
  ...parseDimensionGroup(baseTokens.spacing),
  true: 16,
} as const;

/**
 * Size tokens mirror spacing for consistency.
 */
const SIZE_TOKENS = {
  ...parseDimensionGroup(baseTokens.spacing),
  true: 16,
} as const;

/**
 * Radius tokens for border-radius.
 */
const RADIUS_TOKENS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  round: 1000,
} as const;

/**
 * Base color tokens (non-theme-specific primitives).
 */
const COLOR_TOKENS = {
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

/**
 * Z-index tokens for layering.
 */
const Z_INDEX_TOKENS = {
  0: 0,
  1: 100,
  2: 200,
} as const;

export const tokens = createTokens({
  space: SPACE_TOKENS,
  size: SIZE_TOKENS,
  radius: RADIUS_TOKENS,
  color: COLOR_TOKENS,
  zIndex: Z_INDEX_TOKENS,
});
