# GPUHeatmap

Tier 2 · Compute detail

> Grid of cells, one per GPU slot, color-coded by utilization %. The color ramp uses `colorCompute` (blue family) — never alarm colors. High util is desired, not an alarm.

See it live in the [gallery](./index.html#gpuheatmap).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Cell | `t.colorCompute at varying alpha` | 32×32 square |
| Idle | `t.borderSoft + textSoft "—"` | cells with util < 5% |
| Selected | `t.accent 2px border` | opens side panel |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `utilization` | `number | null` | required | 0–100 |
| `serverId` | `string` | required | For navigation |
| `gpuSlot` | `number` | required | Column index |
| `selected` | `boolean` | `false` | — |
| `onPress` | `() => void` | — | Opens side panel |

## States

- idle · low · mid · high · saturated · selected · no-data

## Accessibility

- ARIA-label per cell: "Server X, GPU slot Y, utilization Z%."

## Don't

- ❌ Never use alarm colors. High utilization is desired. (Rule 1)

## References

- Rule 1
