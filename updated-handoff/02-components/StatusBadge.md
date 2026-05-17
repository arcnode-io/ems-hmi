# StatusBadge

Tier 1 · Alarm visual primitive

> The cornerstone alarm visual. Variants drive both color AND icon shape — color alone is never the signal (a11y, color-blind). Used in top bar, module cards, SLD nodes, health bars.

See it live in the [gallery](./index.html#statusbadge).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Icon | `shape per variant` | caution triangle / warning octagon / flame / wrench / check |
| Label | `matching variant color` | uppercase, 0.18em letter-spacing, fontLabel |
| Background | `variant color at 12% alpha` | `color + 18` hex append |
| Border | `variant color at 30% alpha` | `color + 55` hex append |
| Chevron (→) | `variant color` | only on interactive variant |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"ok"|"warn"|"alarm"|"fire"|"maintenance"|"offline"|"sim"` | required | — |
| `label` | `string` | — | Optional — icon-only if omitted |
| `size` | `"sm"|"md"|"lg"` | `"md"` | 12 / 14 / 18 px icon |
| `acknowledged` | `boolean` | `true` | `false` triggers flash on warn/alarm variants |
| `interactive` | `boolean` | `false` | Enables chevron + button affordance |
| `onPress` | `() => void` | required if interactive | Typecheck-enforced when interactive=true |
| `targetLabel` | `string` | — | Used in ARIA: "tap to {target}" |

## States

- each variant × {acknowledged, unacknowledged}
- fire always pulses opacity 0.6↔1.0 over 800ms
- warn / alarm unacknowledged: badge opacity oscillates 1.0↔0.3 at ~1Hz
- interactive: adds trailing › chevron + cursor pointer + focus ring
- sizes: sm (12px icon, 9px label) / md (14/10) / lg (18/12)

## Accessibility

- role="status" by default; role="button" when interactive.
- ARIA-label: `"{variant} — {label}"` or `"{variant} alarm"` if no label.
- Color paired with distinct icon shape — never color-only.
- Reduced motion: pulse becomes a static state color (no opacity oscillation).

## Don't

- ❌ Never use status colors as the badge color for non-alarm meaning (Rule 1).
- ❌ Never make a non-interactive badge look tappable (no cursor pointer, no chevron). Rule 3.8.
- ❌ Never flash faster than 3Hz (WCAG 2.3.1). Our pulse is ~1Hz.
- ❌ Never style the parent value/label to flash — flash only the badge itself.

## References

- Rules 1, 3.2, 3.3, 3.8
- Used by: ModuleCard, AlarmRow, top bar SIM/LIVE chip, SLD node overlay
