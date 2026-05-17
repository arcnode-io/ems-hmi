/**
 * Design tokens public surface. Components import from here:
 *
 *   import { useTheme } from '@ems-hmi/shared/theme/useTheme';
 *   import { SOVEREIGN, type Theme, resolveTypeStyle, SPACE, RADIUS } from '@ems-hmi/shared/theme/tokens';
 *
 * Sourced from handoff/01-tokens/tokens.ts (designer-authored, single source
 * of truth). Split across ./tokens/* modules to honor the 200-line cap.
 *
 * Generated artifacts (tokens.dtcg.json, tokens.css) are emitted from this
 * file via `npm run tokens:generate`.
 */

export {
  SPACE,
  RADIUS,
  MOTION,
  Z_INDEX,
  BREAKPOINTS,
  SIZE,
  type SpaceKey,
  type RadiusKey,
  type BreakpointKey,
} from "./tokens/primitives";

export {
  type Theme,
  type ThemeName,
  type StatusVariant,
  type DomainKey,
  type ElevationLevel,
  type ElevationRecipe,
} from "./tokens/theme.types";

export {
  TYPE_RAMP,
  resolveTypeStyle,
  type TypeRole,
  type TypeStyle,
} from "./tokens/typography";

export { SOVEREIGN } from "./tokens/sovereign";
export { SOLARPUNK } from "./tokens/solarpunk";
export { withAlpha, THEMES, DEFAULT_THEME } from "./tokens/helpers";
