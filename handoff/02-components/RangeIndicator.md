# RangeIndicator

Tier 0 · Display primitive · type: `bounded float (linear)`

> Horizontal version of Gauge. Used in measurement rows and per-server table cells where vertical space is the constraint.

See it live in the [gallery](./index.html#rangeindicator).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Track | `t.borderSoft` | rounded rectangle |
| Fill | `t.colorBess / Compute / etc` | percentage fill |
| Threshold | `t.statusAlarm · 1px tick` | optional, at threshold positions |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number | null` | required | Current value |
| `min` | `number` | required | — |
| `max` | `number` | required | — |
| `colorToken` | `DomainKey` | `"colorBess"` | — |
| `height` | `number` | `6` | 6px (table row) / 10 (standalone) / 16 (feature) |
| `thresholds` | `Array<{value, token}>` | — | Tick marks |

## States

- normal
- with thresholds (alarm ticks at boundaries)
- no data (empty track)

## Accessibility

- Same as Gauge — ARIA valuenow/min/max on wrapper.

## Don't

- ❌ Never use status colors as fill.
- ❌ Never render at <6px height — too small to read.

## References

- Composed in MeasurementRow, the StrandedCapacity panel, and per-server cluster rows
