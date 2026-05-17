# KPITile

Tier 1 · Composition

> Compact metric display for the Overview status strip and KPI panel. Value + unit + label + optional sublabel + optional trend arrow. Packs 3 in 120px width.

See it live in the [gallery](./index.html#kpitile).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Label row | `t.textSoft · kpiLabel ramp · uppercase` | optional icon top-right |
| Value | `t.[colorToken] · kpiValue ramp` | tabular-nums for live update |
| Unit | `t.textMid · fontLabel small` | baseline-aligned with value |
| Trend | `statusOk / statusWarn` | optional arrow + delta |
| Sublabel | `t.textMid · fontBody small` | one line max |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Uppercase tag |
| `value` | `number | string | null` | required | Renders "—" if null |
| `unit` | `string` | — | — |
| `sublabel` | `string` | — | — |
| `trend` | `"up"|"down"|"flat"` | — | Arrow indicator |
| `trendValue` | `string` | — | Delta e.g. "0.03" |
| `colorToken` | `DomainKey` | `"colorCompute"` | Token for value color |
| `onPress` | `() => void` | — | Navigates to detail; required for interactive |

## States

- normal · with trend · no data · interactive (focusable, focus ring)

## Accessibility

- role="button" if onPress; role="region" otherwise.
- Screen reader: "{label}: {value} {unit}".

## Don't

- ❌ Never use status colors as `colorToken` (Rule 1).
- ❌ Never widen beyond 240px — KPITile is for density, not hero.
- ❌ Never put two trends in one tile.

## References

- Rule 4 · info density
