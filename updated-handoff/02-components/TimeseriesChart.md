# TimeseriesChart

Tier 3 · Data viz

> Line chart with shared time axis. Renders historical (solid) and forecast (dashed) series. Used in Analyst chart panel and Energy screen.

See it live in the [gallery](./index.html#timeserieschart).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Historical series | `colorBess / Compute / etc` | solid 1.75px line |
| Forecast series | `same color at chartForecastAlpha (0.7)` | dashed 5-3 |
| Grid lines | `t.chartGrid` | horizontal at 25/50/75% |
| Thresholds | `t.statusAlarm dashed 4-3` | horizontal, labeled MIN / MAX |
| NOW marker | `t.textMid dashed 2-2` | vertical, labeled NOW at top |
| Y-axis ticks | `t.textSoft · fontLabel · 9px` | min / mid / max |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `series` | `Array<SeriesConfig>` | required | — |
| `timeRange` | `{start, end}` | required | Unix ms |
| `thresholds` | `{min?, max?, minLabel?, maxLabel?}` | — | Overrides class YAML defaults |
| `height` | `number` | `300` | — |
| `onRangeChange` | `(range) => void` | — | Zoom/pan callback |
| `onBrush` | `(range) => void` | — | Passes selection to Analyst chat |

## States

- historical only · with forecast · live (NOW marker) · with thresholds · no data

## Accessibility

- ARIA-label summarizes the series and time range.
- Hidden table mirror for screen readers.
- Reduced motion: no zoom/pan animation — snap instead.

## Don't

- ❌ Never omit MIN/MAX thresholds when the measurement class YAML defines them (Rule 3.6).
- ❌ Never omit NOW marker on a live trailing-edge chart (Rule 3.6).
- ❌ Never use status colors as series fill (high util / nominal SoC are NOT alarm states).

## References

- Rule 3.6 (DS-008)
