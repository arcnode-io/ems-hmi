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
| Apply button | `t.accent (or t.statusSim in SIM)` | opens ConfirmationModal |
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
| `simMode` | `boolean` | `false` | — |
| `onCommand` | `(cmd: CommandPayload) => void` | required | Called after modal confirm |

## States

- live · sim · maintenance (all disabled except MaintenanceToggle) · pending (awaiting MQTT ack)

## Accessibility

- Each form control labeled.
- Disabled controls have aria-disabled=true.

## Don't

- ❌ Never dispatch on first click — always open ConfirmationModal first (Rule 3.1).
- ❌ Never enable Apply if no setpoint is set or mode is unchanged.

## References

- Rule 3.1
- Composed: ConfirmationModal, MaintenanceToggle
