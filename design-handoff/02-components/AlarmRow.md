# AlarmRow

Tier 1 · Alarm surface

> Single row in the active alarm panel (Overview Zone D) and alarm history table. Actionable in the real-time panel (acknowledge), read-only in Analyst.

See it live in the [gallery](./index.html#alarmrow).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Unack pulse dot | `severity color` | leftmost — flashes when unacknowledged |
| Left border | `severity color · 3px` | only when unacknowledged |
| Severity icon | `severity color` | caution / warning octagon / flame |
| Device name | `t.text · fontLabel · 11px bold` | canonical or DTM display name |
| Age | `t.textSoft · fontLabel small` | "4m ago" |
| Alarm name | `t.textMid · fontBody` | humanized alarm name |
| Measurement | `t.text · fontLabel bold` | value causing the alarm |
| Ack button | `ghost · t.border · uppercase` | only when not acknowledged |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `severity` | `"warn"|"alarm"|"fire"` | required | — |
| `acknowledged` | `boolean` | required | — |
| `device` | `string` | required | — |
| `name` | `string` | required | Humanized alarm name |
| `value` | `string` | required | Measurement value |
| `age` | `string` | required | Relative time |
| `onAcknowledge` | `() => void` | — | Absent in Analyst (read-only) |

## States

- warn unack · warn ack · alarm unack · alarm ack · fire (always pulsing)

## Accessibility

- role="alert" while unacknowledged.
- Screen reader: severity + device + alarm name + value + age.
- Ack button is a real <button> with descriptive ARIA-label.

## Don't

- ❌ Never flash the value, the device name, or the row background (Rule 3.3).
- ❌ Never auto-acknowledge — explicit operator action only.
- ❌ Never hide an unacknowledged alarm below the fold without a count badge in the chrome.

## References

- Rules 3.1, 3.3
