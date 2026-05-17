# ConfirmationModal

Tier 2 · Operator control

> Two-step command confirmation. Required before any hardware command dispatches. Draggable.

See it live in the [gallery](./index.html#confirmationmodal).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| SIMULATED band | `t.statusSim` background, `t.textInverse` text | Full-width banner pinned to modal top, label `SIMULATED`. Renders only when `simMode=true`. `data-region="sim-band"` for Playwright. |
| Header bar | `t.borderSoft divider · grab cursor` | draggable, below SIMULATED band if present |
| Command summary | `t.text · fontBody · bold` | human-readable |
| Target panel | `t.bg inset · t.border` | name + current state |
| Cancel | `ghost button` | — |
| Confirm | `t.accent` | Label is always `Send` — never `Send (SIM)`. Color does NOT change in SIM mode. The SIMULATED band carries the cue. |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `commandSummary` | `string` | required | — |
| `targetDevices` | `Array<{id, name, currentState}>` | required | — |
| `batchChecklist` | `boolean` | `false` | — |
| `simMode` | `boolean` | `false` | — |
| `onConfirm` | `() => void` | required | — |
| `onCancel` | `() => void` | required | — |

## States

- idle · sim · pending (spinner on confirm button) · timeout (10s with no ack)

## Accessibility

- role="dialog" · aria-modal=true · focus trap.
- Escape cancels · Enter confirms.

## Don't

- ❌ Never auto-confirm.
- ❌ Never enable confirm before user reads the target panel — focus starts on Cancel.
- ❌ Never embed `(SIM)` in the Confirm button label, and never tint the button `statusSim`. The SIMULATED band is the only SIM affordance on this modal. Per-button SIM text/color was rejected as noise. Amendment locked 2026-05-16.

## References

- Rule 3.1
