/**
 * Theme helpers — withAlpha for token-derived opacity variants;
 * THEMES map + DEFAULT_THEME for picker UIs and tests.
 */

import type { Theme, ThemeName } from "./theme.types";
import { SOVEREIGN } from "./sovereign";
import { SOLARPUNK } from "./solarpunk";

/**
 * Derive an rgba color from a hex token at the given alpha. No shorthand hex.
 * @param hex Full hex (#rrggbb) — shorthand (#rgb) not supported
 * @param alpha 0..1 opacity multiplier
 * @returns CSS rgba string
 * @example withAlpha("#e84040", 0.12) // → "rgba(232, 64, 64, 0.12)"
 */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** All themes, keyed by name — useful for picker UIs and tests. */
export const THEMES: Record<ThemeName, Theme> = {
  sovereign: SOVEREIGN,
  solarpunk: SOLARPUNK,
};

/** Default theme — Sovereign for NOC operator context. */
export const DEFAULT_THEME: ThemeName = "sovereign";
