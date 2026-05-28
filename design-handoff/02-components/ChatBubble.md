# ChatBubble

Tier 3 · Analyst

> Analyst chat message — user and agent variants. Used inside the Chat panel of the Analyst SplitPane.

See it live in the [gallery](./index.html#chatbubble).

## Anatomy

| Region | Token | Note |
|--------|-------|------|
| User bubble | `t.accentFaint bg · t.accentBorder border · right-aligned` | — |
| Agent bubble | `t.panel bg · t.borderSoft border · left-aligned` | with "Arc Node" label above |
| Timestamp | `t.textSoft · 9px · 60% opacity` | — |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | `"user" | "agent" | "loading"` | required | — |
| `text` | `string` | required | Agent uses SSE streaming |
| `time` | `string` | required | — |

## States

- user · agent · loading (animated dots) · streaming

## Accessibility

- role="log" on the container; new messages announced via aria-live="polite".

## Don't

- ❌ Never let the agent message exceed the chart-relevant context — when the answer involves data, the chart is the canonical display, the bubble is the explanation.


