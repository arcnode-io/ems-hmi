# PrebuiltQueryCard

Tier 3 · Analyst

> Tappable shortcut that populates both the chart and sends a chat message simultaneously.

See it live in the [gallery](./index.html#prebuiltquerycard).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Card | `t.surface · t.border · 3px t.accent left border` | — |
| Eyebrow | `t.accent · kpiLabel ramp · "PREBUILT"` | — |
| Label | `t.text · fontBody · 12px` | the query text |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Visible label |
| `query` | `string` | required | Full text sent to agent |
| `chartHint` | `ChartHint` | — | Pre-populates the chart |
| `onSelect` | `() => void` | required | Triggers both actions |

## States

- default · hover · pressed · loading (after tap)

## Accessibility

- role="button" · descriptive ARIA-label.

## Don't

- ❌ Never put more than 6 prebuilt queries in the strip — operators scan, they don't browse.


