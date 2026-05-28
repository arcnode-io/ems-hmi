# Mode

Tier 0 · Display primitive · type: `enum`

> Renders an enum measurement as a colored dot + humanized string label. Drives the visible state for `run_mode`, `alarm_state`, `breaker_state`, etc.

See it live in the [gallery](./index.html#mode).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Dot | `8px circle, color from `x-severity` token` | gray when no severity |
| Label | `t.text · fontLabel · uppercase · 0.18em ls` | humanized canonical name |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string | null` | required | The enum value (canonical name; component humanizes) |
| `severity` | `"ok" | "warn" | "alarm" | null` | `null` | From AsyncAPI `x-severity` per enum value |

## States

- severity: ok → statusOk dot
- severity: warn → statusWarn dot
- severity: alarm → statusAlarm dot
- no severity → textSoft (neutral gray) dot — label still rendered
- no data → "—", no dot

## Accessibility

- Screen reader announces label only — dot is decorative.
- Severity is reinforced by color + the alarm icons elsewhere on the screen, never by Mode alone.

## Don't

- ❌ Never invent a severity for a mode enum that doesn't have one in the schema. The class YAML owns severity.
- ❌ Never humanize the value differently per screen. Resolve once via display config.

## References

- AsyncAPI `x-severity`
- Humanization rule: strip underscores, title-case, preserve known acronyms
