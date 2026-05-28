# Indicator

Tier 0 · Display primitive · type: `bool`

> Colored dot representing a binary state. Color IS the signal — no label needed. Used in tables and compact rows where space is critical.

See it live in the [gallery](./index.html#indicator).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Dot | `t.statusOk / t.statusAlarm / t.textSoft` | 8/10/14px depending on size prop |
| Glow | `matching color at 25% alpha` | `box-shadow: 0 0 0 Xpx` |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `state` | `boolean | null` | required | `true` = ok, `false` = fault, `null` = no data |
| `size` | `"sm" | "md" | "lg"` | `"md"` | 8px / 10px / 14px diameter |

## States

- true (ok) → statusOk
- false (fault) → statusAlarm
- null (no data) → textSoft (gray, no glow)

## Accessibility

- Surround with text context — the dot itself is decorative for AT.
- ARIA-label on parent element conveys state.

## Don't

- ❌ Never add a label to an Indicator — by convention, color IS the entire signal. If you need a label, use `Mode`.
- ❌ Never use Indicator for severity beyond binary. Three-state OK/WARN/ALARM uses `StatusBadge`.

## References

- Maps to AsyncAPI `type: bool`
