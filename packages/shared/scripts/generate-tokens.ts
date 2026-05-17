/**
 * Token generator — reads packages/shared/src/theme/tokens.ts and emits:
 *   - tokens.dtcg.json  (DTCG-format export for Figma plugins, Style Dictionary)
 *   - tokens.css        (CSS custom properties for non-React consumers)
 *
 * Run: `npm run tokens:generate` from packages/shared/
 *
 * Outputs land next to tokens.ts and are committed (audit trail).
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { SOVEREIGN } from "../src/theme/tokens/sovereign";
import { SOLARPUNK } from "../src/theme/tokens/solarpunk";
import { SPACE, RADIUS, MOTION, Z_INDEX } from "../src/theme/tokens/primitives";
import { TYPE_RAMP } from "../src/theme/tokens/typography";
import type { Theme } from "../src/theme/tokens/theme.types";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME_DIR = resolve(HERE, "../src/theme");

interface DtcgValue {
  $value: string | number | object;
  $type: string;
}

function themeToDtcg(t: Theme): Record<string, DtcgValue> {
  const out: Record<string, DtcgValue> = {};
  for (const [k, v] of Object.entries(t)) {
    if (typeof v === "string") {
      const isFont = k.startsWith("font");
      out[k] = {
        $value: v,
        $type: isFont ? "fontFamily" : "color",
      };
    } else if (typeof v === "number") {
      out[k] = { $value: v, $type: "number" };
    }
  }
  return out;
}

const dtcg = {
  $schema: "https://design-tokens.github.io/community-group/format/",
  sovereign: themeToDtcg(SOVEREIGN),
  solarpunk: themeToDtcg(SOLARPUNK),
  primitive: {
    space: Object.fromEntries(
      Object.entries(SPACE).map(([k, v]) => [
        k,
        { $value: `${v}px`, $type: "dimension" },
      ]),
    ),
    radius: Object.fromEntries(
      Object.entries(RADIUS).map(([k, v]) => [
        k,
        { $value: `${v}px`, $type: "dimension" },
      ]),
    ),
    motion: {
      duration: Object.fromEntries(
        Object.entries(MOTION.duration).map(([k, v]) => [
          k,
          { $value: `${v}ms`, $type: "duration" },
        ]),
      ),
      easing: Object.fromEntries(
        Object.entries(MOTION.easing).map(([k, v]) => [
          k,
          { $value: v, $type: "cubicBezier" },
        ]),
      ),
    },
    zIndex: Object.fromEntries(
      Object.entries(Z_INDEX).map(([k, v]) => [
        k,
        { $value: v, $type: "number" },
      ]),
    ),
    typeRamp: Object.fromEntries(
      Object.entries(TYPE_RAMP).map(([k, v]) => [
        k,
        { $value: v, $type: "typography" },
      ]),
    ),
  },
};

writeFileSync(
  resolve(THEME_DIR, "tokens.dtcg.json"),
  JSON.stringify(dtcg, null, 2) + "\n",
);

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

function themeVars(t: Theme): string[] {
  return Object.entries(t)
    .filter(([, v]) => typeof v === "string" || typeof v === "number")
    .map(([k, v]) => `  --${kebab(k)}: ${String(v)};`);
}

const css = [
  "/* Generated from tokens.ts. Do not edit by hand. */",
  "",
  ":root {",
  ...Object.entries(SPACE).map(([k, v]) => `  --space-${k}: ${v}px;`),
  ...Object.entries(RADIUS).map(([k, v]) => `  --radius-${k}: ${v}px;`),
  ...Object.entries(MOTION.duration).map(
    ([k, v]) => `  --duration-${k}: ${v}ms;`,
  ),
  ...Object.entries(Z_INDEX).map(([k, v]) => `  --z-${kebab(k)}: ${v};`),
  "}",
  "",
  '[data-theme="sovereign"], :root {',
  ...themeVars(SOVEREIGN),
  "}",
  "",
  '[data-theme="solarpunk"] {',
  ...themeVars(SOLARPUNK),
  "}",
  "",
].join("\n");

writeFileSync(resolve(THEME_DIR, "tokens.css"), css);

console.log("✓ tokens.dtcg.json + tokens.css regenerated");
