# Tokens

The design tokens for ARCNODE EMS HMI. **`tokens.ts` is the source of truth.** Everything else in this folder is generated.

---

## Files

| File | Purpose | Edit by hand? |
|------|---------|--------------|
| `tokens.ts` | TypeScript source. The contract for every component. | ✅ **Yes** |
| `tokens.dtcg.json` | DTCG-format export — for Figma plugins, Style Dictionary, other design tools. | ❌ Generated |
| `tokens.css` | CSS custom properties for both themes — for non-React consumers (print PDFs, email templates, marketing site). | ❌ Generated |

Regenerate from `tokens.ts`:

```sh
node scripts/generate-tokens.mjs
# emits tokens.dtcg.json + tokens.css from tokens.ts
```

(That script is at the bottom of this README — copy it into `packages/shared/scripts/` when integrating.)

---

## How to consume

### React (web or RN)

```tsx
import { SOVEREIGN, SOLARPUNK, type Theme, resolveTypeStyle } from '@ems-hmi/shared/theme/tokens';
import { useTheme } from '@ems-hmi/shared/theme/useTheme';

export function StatusBadge({ variant, label }) {
  const t = useTheme();
  const c = t.statusColors[variant];

  return (
    <View style={{
      paddingHorizontal: t.space[2],
      paddingVertical: t.space[1],
      borderRadius: t.radius[2],
      backgroundColor: withAlpha(c, 0.15),
      borderWidth: 1,
      borderColor: c,
      flexDirection: 'row',          // ← required (RN defaults to column)
      alignItems: 'center',
      gap: t.space[1],
    }}>
      <Text style={[resolveTypeStyle(t, 'kpiLabel'), { color: c }]}>{label}</Text>
    </View>
  );
}
```

### CSS-only contexts (rare)

```css
@import "@ems-hmi/shared/theme/tokens.css";

.health-bar {
  background: var(--sovereign-surface);
  border-left: 3px solid var(--sovereign-status-ok);
  border-radius: var(--radius-3);
  padding: var(--space-4);
}

/* Solarpunk swap */
[data-theme="solarpunk"] .health-bar {
  background: var(--solarpunk-surface);
  border-left-color: var(--solarpunk-status-ok);
}
```

---

## Token groups

| Group | Purpose | Examples |
|-------|---------|----------|
| **Surface** | Tonal layering — bg → surface → panel → raised → sunken | `bg`, `surface`, `panel`, `raised`, `sunken` |
| **Border** | Structural lines | `border`, `borderSoft`, `borderFocus` |
| **Text** | Type hierarchy | `text`, `textMid`, `textSoft`, `textFaint`, `textInverse` |
| **Accent** | CTAs, focus rings, active nav — **NOT alarm** | `accent`, `accentDim`, `accentFaint`, `accentBorder` |
| **Status** ⚠️ | Alarm states. **RESERVED — never decorative.** | `statusOk/Warn/Alarm/Fire/Maintenance/Offline/Sim` |
| **Domain** | Per-system color coding (charts, KPIs) — non-alarm | `colorBess`, `colorCompute`, `colorThermal`, `colorGrid`, `colorPv`, `colorRevenue` |
| **Chart** | Grid + axis tints | `chartGrid`, `chartAxis`, `chartForecastAlpha` |
| **State** | Hover, pressed, focus, disabled overlays | `hoverOverlay`, `pressedOverlay`, `focusRing`, `disabledOpacity` |
| **Elevation** | 5 levels (0..4), each: `{ background, highlight, shadow }` | `elevation[0..4]` |
| **Font** | Family resolution per theme | `fontHeading`, `fontLabel`, `fontBody`, `fontMono` |

Plus shared primitives (not theme-dependent):

| Primitive | Purpose |
|-----------|---------|
| `SPACE` | Spacing scale, base 4 |
| `RADIUS` | Corner radius scale |
| `MOTION` | `{duration: {fast,base,slow,pulse}, easing: {...}}` |
| `Z_INDEX` | Layer stack |
| `BREAKPOINTS` | xs/sm/lg/xl |
| `SIZE` | Fixed-size shell elements (topBar, sidebar, etc) |
| `TYPE_RAMP` | Semantic type roles |

---

## Hard rules

1. **NEVER hardcode hex values** in component code. Always go through a token.
2. **Status colors are RESERVED** (`statusOk/Warn/Alarm/Fire`). Use them ONLY on alarm-state elements. Never as a CTA, never as a badge color, never as a chart series fill. This is Hollifield §7.11 — the pre-attentive channel must stay clean.
3. **Domain colors `colorBess/Compute/Thermal/Grid` are for measurement-display only.** A BESS card uses `colorBess` for its SoC ring. The same color should NOT appear on a Compute card. Color = identity here.
4. **Type goes through `TYPE_RAMP`** via `resolveTypeStyle(t, 'role')`. No raw `fontSize: 14` in component code.
5. **Space + radius go through `t.space[n]` / `t.radius[n]`.** No raw `padding: 16`.
6. **Adding a token** = update `tokens.ts`, both themes, regenerate exports. No "I'll add it just for Sovereign" — monochrome themes are not themes.

---

## RN gotchas (cross-platform)

Components in `packages/shared` run on web (via `react-native-web`) and mobile (RN native). These are the things that bite:

| Gotcha | What to do |
|--------|-----------|
| `flexDirection` defaults to `column` on RN, `row` on web | **Always specify it explicitly** in shared components |
| `gap` works in RN ≥ 0.71 — safe | Use it freely |
| Text MUST be wrapped in `<Text>` | No bare strings inside `<View>` |
| No `onClick` on RN — use `onPress` via `Pressable` / `TouchableOpacity` | RN-Web maps these to mouse events on web |
| No `cursor: pointer` on RN | Conditionally apply on web only, or rely on Pressable's automatic web cursor |
| No `:hover` / `:focus` pseudo-classes | Use `Pressable`'s state callback: `style={({pressed, hovered}) => …}` |
| No `boxShadow` on RN (use `shadowColor/Offset/Opacity/Radius` + `elevation`) | Our `elevation[n]` already includes both — web uses the `shadow`/`highlight` keys, RN reads the same values into its shadow props via a small helper |
| `position: 'fixed'` doesn't exist on RN | Use `position: 'absolute'` inside a parent that pins to the viewport |
| Percentage widths inside flex sometimes glitch on Android | Prefer `flex: n` shares over `width: "50%"` |

---

## Generate script (`scripts/generate-tokens.mjs`)

Drop this into `packages/shared/scripts/`:

```js
// Reads tokens.ts at runtime via tsx, emits tokens.dtcg.json + tokens.css
// Run: npx tsx scripts/generate-tokens.mjs
import { writeFileSync } from 'node:fs';
import { SOVEREIGN, SOLARPUNK, SPACE, RADIUS, MOTION, Z_INDEX, TYPE_RAMP } from '../src/theme/tokens';

// ── DTCG JSON ─────────────────────────────────────────────────────────────
const dtcg = {
  $schema: 'https://design-tokens.github.io/community-group/format/',
  sovereign: themeToDtcg(SOVEREIGN),
  solarpunk: themeToDtcg(SOLARPUNK),
  primitive: {
    space:  Object.fromEntries(Object.entries(SPACE).map(([k, v]) => [k, { $value: `${v}px`, $type: 'dimension' }])),
    radius: Object.fromEntries(Object.entries(RADIUS).map(([k, v]) => [k, { $value: `${v}px`, $type: 'dimension' }])),
    motion: {
      duration: Object.fromEntries(Object.entries(MOTION.duration).map(([k, v]) => [k, { $value: `${v}ms`, $type: 'duration' }])),
      easing:   Object.fromEntries(Object.entries(MOTION.easing).map(([k, v]) => [k, { $value: v,           $type: 'cubicBezier' }])),
    },
    zIndex: Object.fromEntries(Object.entries(Z_INDEX).map(([k, v]) => [k, { $value: v, $type: 'number' }])),
  },
};

function themeToDtcg(t) {
  const out = {};
  for (const [k, v] of Object.entries(t)) {
    if (typeof v === 'string' && v.startsWith('#')) {
      out[k] = { $value: v, $type: 'color' };
    } else if (typeof v === 'string') {
      out[k] = { $value: v, $type: k.startsWith('font') ? 'fontFamily' : 'color' };
    }
  }
  return out;
}

writeFileSync('src/theme/tokens.dtcg.json', JSON.stringify(dtcg, null, 2));

// ── CSS variables ─────────────────────────────────────────────────────────
const css = [
  `/* Generated from tokens.ts. Do not edit by hand. */`,
  '',
  `:root {`,
  ...Object.entries(SPACE ).map(([k, v]) => `  --space-${k}: ${v}px;`),
  ...Object.entries(RADIUS).map(([k, v]) => `  --radius-${k}: ${v}px;`),
  `}`,
  '',
  `[data-theme="sovereign"], :root {`,
  ...themeVars(SOVEREIGN, 'sovereign'),
  `}`,
  '',
  `[data-theme="solarpunk"] {`,
  ...themeVars(SOLARPUNK, 'solarpunk'),
  `}`,
].join('\n');

function themeVars(t, prefix) {
  return Object.entries(t)
    .filter(([_, v]) => typeof v === 'string')
    .map(([k, v]) => `  --${kebab(k)}: ${v};`);
}
function kebab(s) { return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }

writeFileSync('src/theme/tokens.css', css);

console.log('✓ tokens.dtcg.json + tokens.css regenerated');
```

Wire it into `package.json`:

```json
"scripts": {
  "tokens:generate": "tsx scripts/generate-tokens.mjs"
}
```

Run before commit, or set up a `pre-commit` hook if you want it enforced.
