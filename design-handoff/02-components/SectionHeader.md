# SectionHeader

Tier 1 · Structure

> Consistent section labeling within a screen. Used at the top of each card-group / panel.

See it live in the [gallery](./index.html#sectionheader).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| Label chip | `t.accent text · t.accentFaint bg · accentBorder` | kpiLabel ramp |
| Heading | `t.text · fontHeading · cardHeading ramp` | screenTitle ramp for page-level |
| Sub | `t.textMid · fontBody · bodyDense ramp` | optional |
| Action | `inline link or button on the right` | optional |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Uppercase tag e.g. "ENERGY" |
| `heading` | `string` | required | — |
| `sub` | `string` | — | — |
| `action` | `React.ReactNode` | — | Optional right-aligned action |

## States

- default · with action · with sub

## Accessibility

- Renders as a real `<h2>` so screen readers can navigate sections.

## Don't

- ❌ Never use status colors on the label chip.
- ❌ Don't put more than one chip / heading on the same row — use a single SectionHeader.


