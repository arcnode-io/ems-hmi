# Gauge

Tier 0 · Display primitive · type: `bounded float (radial)`

> Circular arc showing position in operating range. Used for SoC %, chiller capacity %, PUE — anywhere a value lives within fixed bounds.

See it live in the [gallery](./index.html#gauge).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Track | `t.borderSoft` | 4px stroke ring |
| Fill arc | `t.colorBess / Compute / Thermal (domain)` | NEVER status color — high util is desired |
| Value | `t.text · fontLabel` | 16px or 22px depending on size |
| Sublabel | `t.textSoft · fontLabel · kpiLabel ramp` | optional, e.g. "6h runway" |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number | null` | required | Current value |
| `min` | `number` | required | Arc start |
| `max` | `number` | required | Arc end |
| `unit` | `string` | required | Display unit |
| `colorToken` | `"colorBess"|"colorCompute"|…` | `"colorBess"` | Domain color key on the theme |
| `thresholds` | `Array<{value, token}>` | — | Warn/alarm bands as tick marks |
| `label` | `string` | — | Optional sublabel |
| `size` | `"sm"|"md"|"lg"` | `"md"` | 80 / 120 / 180 px |

## States

- normal → domain-colored arc
- thresholds → arc still domain-colored, ticks in statusAlarm
- no data → empty arc (gray track only), value renders as "—"

## Accessibility

- ARIA-valuenow / min / max on the wrapper.
- Screen reader announces value + unit + optional sublabel.

## Don't

- ❌ Never use status colors as the fill (DS-001 / Rule 1). Even high SoC stays `colorBess`, not `statusOk`.
- ❌ Never animate fill across `prefers-reduced-motion: reduce` — snap to value instead.
- ❌ Never show a Gauge without unit context.

## References

- Rule 1 · domain vs. status
- Composed by `KPITile`, used as hero on BESS detail
