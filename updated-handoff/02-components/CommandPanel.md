# CommandPanel

Tier 2 · Operator control

> Structured panel for all operator commands to hardware. Never a single loose button. All actions route through ConfirmationModal.

See it live in the [gallery](./index.html#commandpanel).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Header | `t.panel bg · t.borderSoft divider` | device name + section |
| Mode selector | `segmented control with t.accent active` | — |
| Setpoint input | `t.sunken bg · t.border` | P + optional Q |
| Apply button | `t.accent` | opens ConfirmationModal — color does NOT change in SIM (see Don't below) |
| Maintenance toggle | `switch · statusMaintenance fill when on` | see MaintenanceToggle |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deviceId` | `string` | required | — |
| `deviceDisplayName` | `string` | required | — |
| `runModeOptions` | `EnumOption[]` | required | From AsyncAPI spec |
| `currentRunMode` | `string` | required | — |
| `powerSetpoint` | `SetpointConfig | null` | — | — |
| `supportsReset` | `boolean` | `false` | — |
| `supportsBmcReset` | `boolean` | `false` | Compute only |
| `maintenanceMode` | `boolean` | `false` | Disables all controls |
| `simMode` | `boolean` | `false` | Pass-through to ConfirmationModal — does NOT alter Apply button color or label |
| `onCommand` | `(cmd: CommandPayload) => void` | required | Called after modal confirm |

## States

- live · sim · maintenance (all disabled except MaintenanceToggle) · pending (awaiting MQTT ack)

## Accessibility

- Each form control labeled.
- Disabled controls have aria-disabled=true.

## Don't

- ❌ Never dispatch on first click — always open ConfirmationModal first (Rule 3.1).
- ❌ Never enable Apply if no setpoint is set or mode is unchanged.
- ❌ Never append `(SIM)` to the Apply button label, and never tint the button `statusSim`. The SIM cue lives at two places only: the global SIM banner (ambient) and the ConfirmationModal SIMULATED band (decision-point). Per-button SIM affordance was rejected as noise. Amendment locked 2026-05-16.

## References

- Rule 3.1
- Composed: ConfirmationModal, MaintenanceToggle
