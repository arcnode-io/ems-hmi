# MeasurementRow

Tier 2 · Detail page

> Standard row for displaying a named measurement inside a module detail page. Composes one of the five Tier 0 primitives + optional inline sparkline.

See it live in the [gallery](./index.html#measurementrow).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Label | `t.textMid · fontBody` | — |
| Sparkline | `t.colorCompute` | optional, 60×16 inline SVG |
| Value | `composes a Tier-0 primitive` | Reading / Indicator / Mode / RangeIndicator |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Humanized measurement name |
| `primitive` | `ReadingProps | IndicatorProps | ModeProps | GaugeProps | RangeIndicatorProps` | required | Which primitive + data |
| `sparkline` | `number[]` | — | Last-N samples |

## States

- ok · stale · no-data · with sparkline

## Accessibility

- ARIA-label combines label + primitive value.

## Don't

- ❌ Never exceed 40px row height (SIZE.tableRow = 38).


