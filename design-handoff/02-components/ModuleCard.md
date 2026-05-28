# ModuleCard

Tier 1 · Composition

> Compact representation of a device-0 (module-tier device) — BESS, Compute, Thermal, Grid. Used on the `/modules` list and the Overview. Tap → module detail.

See it live in the [gallery](./index.html#modulecard).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Type icon | `domain color (colorBess/Compute/etc) at 12% bg` | 28x28 square with rounded corners |
| Display name | `t.text · fontLabel · 12px · bold` | from DTM `display_name` |
| Type label | `t.textSoft · fontLabel · kpiLabel ramp` | "bess module" etc |
| Status badge | `StatusBadge sm component` | reflects current alarm state |
| Alarm count | `#fff on statusAlarm/statusWarn bg` | count badge top-right |
| Measurement row | `t.textMid label · t.text value` | up to 3 rows |
| Maintenance overlay | `t.statusMaintenance border + wrench label` | when maintenance=true |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `moduleType` | `"bess"|"compute"|"thermal"|"grid"` | required | Determines icon + domain color |
| `displayName` | `string` | required | From DTM |
| `status` | `StatusVariant` | required | — |
| `acknowledged` | `boolean` | `true` | Passed to StatusBadge |
| `alarmCount` | `number` | `0` | — |
| `maintenance` | `boolean` | `false` | Overlays wrench + dims content |
| `measurements` | `Array<{label, value}>` | `[]` | Up to 3 rows |
| `onPress` | `() => void` | required | Navigates to module detail |

## States

- ok · warn (unack) · alarm (unack) · fire · offline · maintenance
- with / without alarmCount badge
- measurement rows 0..3

## Accessibility

- role="button" — the whole card is tappable.
- ARIA-label aggregates the visible content.

## Don't

- ❌ Never use a moduleType's domain color for a different moduleType (Rule 1 — domain = identity).
- ❌ Never render maintenance with a status color border — only `statusMaintenance`.

## References

- Composes: StatusBadge, IconBess/Compute/Thermal/Grid
