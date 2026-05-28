# Reading

Tier 0 · Display primitive · type: `float`

> Renders a numeric float measurement with its unit. Every `float`-typed measurement in the AsyncAPI spec uses this.

See it live in the [gallery](./index.html#reading).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Number digits | `t.text (or statusWarn/statusAlarm if tone)` | tabular-nums for vertical alignment |
| Unit suffix | `t.textMid` | `fontLabel` family |
| Missing value | `t.textMid` | renders as `"—"` (em dash) |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number | null` | required | Numeric value; `null` renders "—" |
| `unit` | `string` | required | Display unit (`"kW"`, `"%"`, `"V"`) |
| `variant` | `"body" | "dense" | "kpi" | "hero" | "table"` | `"body"` | Size + weight preset |
| `tone` | `"normal" | "warn" | "alarm"` | `"normal"` | Override color for fault display |

## States

- normal · body / dense / kpi / hero variants
- no-data (value=null) → "—" in textMid
- warn tone → statusWarn color
- alarm tone → statusAlarm color
- stale (>2× poll rate) → render same as no-data

## Accessibility

- Wrap with surrounding label context for screen readers — Reading itself is just text.
- Tabular-nums ensures consistent digit width in tables.
- Reduced motion does not affect Reading.

## Don't

- ❌ Never render `"0"` for missing data. Zero is a valid measurement; missing data is distinct.
- ❌ Never use status colors for "ok" values. `t.text` is the OK color. statusOk is for alarm-state elements only.
- ❌ Never hardcode `fontSize`. Use the `variant` prop.

## References

- Rule 3.4 (DS-003)
- Type ramp roles: `body`, `kpiValue`, `display`
