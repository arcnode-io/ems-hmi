# ConfirmationModal

Tier 2 · Operator control

> Two-step command confirmation. Required before any hardware command dispatches. Draggable.

See it live in the [gallery](./index.html#confirmationmodal).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Header bar | `t.borderSoft divider · grab cursor` | draggable |
| Command summary | `t.text · fontBody · bold` | human-readable |
| Target panel | plain row on `t.surface` · no fill, no border | name + current state; read-only, so it must not look like a field |
| Editor slot (optional) | field: `t.bg` fill · `t.border` → `t.borderFocus` on focus | the value being confirmed (e.g. reserve MWh); the only field-styled element |
| SIM badge | `t.statusSim` | only when sim=true |
| Cancel | `ghost button` | — |
| Confirm | `t.accent (or t.statusSim if sim)` | "Send (SIM)" in sim mode |

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

## References

- Rule 3.1
