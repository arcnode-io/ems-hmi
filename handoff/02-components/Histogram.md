# Histogram

Tier 3 · Data viz

> Distribution chart for snapshot measurements across a population — cell voltages across all cells in a BESS pack, GPU core temperatures across servers in a cluster. The primary diagnostic for "is the population uniform" — the question a single scalar (mean, max) hides.

See it live in the [gallery](./index.html#histogram).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| In-range bins | `t.colorBess / Compute / etc (domain color)` | filled rectangles |
| Outlier bins | `t.statusAlarm` | bins straddling threshold count as outlier |
| Thresholds | `t.statusAlarm dashed 4-3 vertical` | labeled MIN / MAX |
| Axis ticks | `t.textSoft · fontLabel · 9px` | with unit suffix |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `samples` | `number[]` | required | Raw values; bin width auto-derived |
| `unit` | `string` | required | — |
| `domainColor` | `DomainKey` | required | In-range bin fill |
| `thresholds` | `{min?, max?}` | — | From class YAML |
| `binWidth` | `number` | — | Override auto |
| `height` | `number` | `200` | — |

## States

- nominal (no outliers) · with outliers (in statusAlarm) · with thresholds · no data

## Accessibility

- role="img" with aria-label summarizing the distribution: "BESS-02 cell voltage distribution: 312 cells, range 3.18–3.40 V, 14 cells outside threshold."
- Hidden table mirror with bin ranges + counts.

## Don't

- ❌ Never render an empty Histogram with axes but no bars — reads as "all zero", which is dangerous (Rule 3.4).
- ❌ Never use status colors for in-range bins (Rule 1). Outlier bins are the exception.

## References

- Rule 3.6
