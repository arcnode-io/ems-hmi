# RN-Web Mapping Guide

How to translate the mocks (which use plain DOM JSX) into the production shared components (which use React Native primitives via `react-native-web`).

The mocks at `03-screens/` and `02-components/index.html` are **agent-readable visual specs**. They use `<div>`, `<span>`, and inline style props because that's easiest for the gallery. The production components in `packages/shared/src/components/` must use RN primitives so they work on web AND mobile.

This file is the translation key.

---

## Primitive mapping

| Mock pattern (HTML) | Production (RN) | Notes |
|--------------------|-----------------|-------|
| `<div style={...}>` | `<View style={...}>` | RN renders → web DOM via RN-Web |
| `<span style={...}>` | `<Text style={...}>` | **All text** must be inside `<Text>` on RN |
| `"some text"` (bare string) | `<Text>some text</Text>` | RN throws on bare strings |
| `<button onClick={...}>` | `<Pressable onPress={...}>` | `<button>` doesn't render on RN |
| `<a href="...">` | `<Pressable onPress={() => navigate(...)}>` | React Navigation, not href |
| `<img src="..."/>` | `<Image source={{uri: ...}}/>` | — |
| `<input value={x} onChange={...}>` | `<TextInput value={x} onChangeText={...}>` | Note: `onChangeText` takes string, not event |
| `<svg>` | `<Svg>` from `react-native-svg` | Same JSX, different import |

---

## Style mapping

| Mock CSS | RN equivalent | Notes |
|---------|---------------|-------|
| `display: 'flex'` | (implicit on `<View>`) | RN Views are always flex containers |
| `flexDirection: 'row'` | `flexDirection: 'row'` | **Required — RN defaults to `column`, web to `row`** |
| `gap` | `gap` | Supported on RN 0.71+, you're on 0.76 ✓ |
| `padding`, `margin` | same | RN accepts numbers (px) or strings (`"10px"` not allowed — number only) |
| `backgroundColor` | `backgroundColor` | Note: not `background` shorthand |
| `borderColor`, `borderWidth`, `borderRadius` | same | No `border: '1px solid'` shorthand — use the three props |
| `boxShadow: '...'` | `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` (Android) | Our elevation tokens encapsulate both — see below |
| `position: 'fixed'` | not supported | Use `position: 'absolute'` inside a parent pinned to viewport |
| `transform: 'translateY(-2px)'` | `transform: [{ translateY: -2 }]` | RN uses array of single-key objects |
| `cursor: 'pointer'` | not supported on RN | Apply conditionally via `Platform.OS === 'web'` or rely on `Pressable`'s auto cursor |
| `:hover`, `:focus`, `:active` | not supported | Use `Pressable`'s state callback: `style={({pressed, hovered}) => ...}` |
| `transition` | not supported | Use `Animated` API or `react-native-reanimated` for transitions |
| `font-feature-settings: "tnum"` | `fontVariant: ['tabular-nums']` | Different syntax, same outcome |

---

## Elevation cross-platform

Our `t.elevation[n]` tokens encapsulate the platform difference. Use them like this:

```tsx
import { Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';

export function Card({ children, level = 1 }) {
  const t = useTheme();
  const e = t.elevation[level];

  // The token shape: { background, highlight, shadow }
  // - `background` always applies
  // - `highlight` (inset 1px) is web-only — RN can't do inset shadows
  // - `shadow` is split into web boxShadow vs RN shadowProps + Android elevation
  const platformStyle = Platform.OS === 'web'
    ? { backgroundColor: e.background, boxShadow: [e.highlight, e.shadow].filter(Boolean).join(', ') }
    : {
        backgroundColor: e.background,
        // RN equivalent of the same shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: level * 2 },
        shadowOpacity: 0.1 + level * 0.1,
        shadowRadius: level * 4,
        elevation: level * 2,  // Android
      };

  return <View style={[platformStyle, baseStyle]}>{children}</View>;
}
```

In practice, ship a tiny helper `getElevationStyle(level, theme)` in `packages/shared/src/theme/elevation.ts` that does this once.

---

## Typography cross-platform

Use the `resolveTypeStyle(theme, role)` helper from `tokens.ts`:

```tsx
import { Text } from 'react-native';
import { useTheme, resolveTypeStyle } from '../theme';

export function KPILabel({ children }) {
  const t = useTheme();
  return (
    <Text style={[resolveTypeStyle(t, 'kpiLabel'), { color: t.textSoft }]}>
      {children}
    </Text>
  );
}
```

`resolveTypeStyle` returns a style object compatible with both `<Text>` (RN) and any DOM element via RN-Web mapping.

**Caveat:** RN doesn't support `textTransform: 'uppercase'` consistently across all Android versions. For uppercase labels (kpiLabel, caption), prefer to uppercase the string at the JSX layer:

```tsx
// Safer:
<Text style={resolveTypeStyle(t, 'kpiLabel')}>{label.toUpperCase()}</Text>

// Risky:
<Text style={[resolveTypeStyle(t, 'kpiLabel'), { textTransform: 'uppercase' }]}>{label}</Text>
```

---

## Hover / pressed / focus

`Pressable` exposes its state in a callback style — use it for all interactive elements:

```tsx
<Pressable
  onPress={onPress}
  style={({ pressed, hovered, focused }) => [
    {
      paddingHorizontal: t.space[3],
      paddingVertical: t.space[2],
      backgroundColor: pressed ? t.pressedOverlay
                     : hovered ? t.hoverOverlay
                     : 'transparent',
      borderWidth: focused ? 2 : 1,
      borderColor: focused ? t.focusRing : t.border,
      borderRadius: t.radius[2],
    },
    style,
  ]}
>
  {({ pressed }) => <Text style={{ opacity: pressed ? 0.85 : 1 }}>{children}</Text>}
</Pressable>
```

The `hovered` state is RN-Web-only (Pressable doesn't fire it on native — there's no hover on touch). Don't conditionalize logic on `hovered`; just style.

---

## Reduced motion

```tsx
import { AccessibilityInfo } from 'react-native';

function useReducedMotion() {
  const [enabled, set] = React.useState(false);
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(set);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', set);
    return () => sub.remove();
  }, []);
  return enabled;
}
```

Use it to gate decorative animations. Constitution Rule 5 — alarm pulses become a static state color under reduced motion.

---

## Module / file layout

```
packages/shared/src/
├── theme/
│   ├── tokens.ts                ← drop in from handoff/01-tokens/
│   ├── ThemeProvider.tsx
│   ├── useTheme.ts
│   └── elevation.ts             ← getElevationStyle() helper
├── components/
│   ├── primitives/              ← Reading, Indicator, Mode, Gauge, RangeIndicator
│   ├── shell/                   ← StatusBadge, KPITile, SectionHeader, ModuleCard, AlarmRow
│   ├── detail/                  ← MeasurementRow, GPUHeatmap, CommandPanel, ConfirmationModal
│   ├── charts/                  ← TimeseriesChart, Histogram, BarChart
│   └── analyst/                 ← ChatBubble, PrebuiltQueryCard, SplitPane, AlarmTable
└── ...
```

One component per file. Co-locate types in `<Component>.types.ts` if they get long.

---

## When to break the rule

If you genuinely need a web-only feature (e.g. CSS `filter: blur`, `position: sticky`, `backdrop-filter`, etc.):

1. Create a `<Component>.web.tsx` next to `<Component>.tsx`. Metro and Vite both resolve these automatically.
2. The native version uses the closest RN-compatible alternative (or simply omits the effect).
3. Document the divergence in the component's `.md` under a **Platform notes** section.

```
shell/
├── SLDDiagram.tsx           ← native (mobile)
├── SLDDiagram.web.tsx       ← web (uses react-svg-pan-zoom, no native equivalent yet)
└── SLDDiagram.types.ts      ← shared props
```

---

## Checklist for porting a mock to production

When converting a mock JSX function (e.g. `OverviewScreen({ t })`) into a real component:

- [ ] `<div>` → `<View>`
- [ ] All bare text → wrapped in `<Text>`
- [ ] `<button>` / `<a>` → `<Pressable onPress>`
- [ ] Every `style` block: replace `flexDirection: 'row'` (always explicit)
- [ ] Every color hex → token reference
- [ ] Every spacing number → `t.space[n]`
- [ ] Every radius number → `t.radius[n]`
- [ ] Every font size → `resolveTypeStyle(t, role)`
- [ ] Every hover / focus / active → `Pressable` state callback
- [ ] Every transition / animation → `Animated` API or simply omit if decorative
- [ ] Every `position: 'fixed'` → `absolute` inside viewport-pinned parent
- [ ] Add `data-comp="ComponentName"` for Playwright hooks
- [ ] Add `data-state` / `data-variant` if state-driven
- [ ] Reduced-motion path: gate decorative animations on `useReducedMotion()`
