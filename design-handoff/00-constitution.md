# Design System Constitution

**ARCNODE EMS HMI.** Read this at the start of every session. Re-read before any cross-cutting change.

These rules are non-negotiable. They exist because a misclick on this product can damage hardware, miss a fault, or hurt someone. The design system protects against that.

If a rule feels wrong for a specific case, **the case is wrong** — propose an exception, get sign-off, document it as a per-component override in that component's `.md`. Don't silently violate.

---

## 1. Color discipline (Hollifield §7.11)

The pre-attentive system cannot distinguish "this amber is a button" from "this amber is an alarm." When alarm colors appear decoratively, the alarm channel goes dead.

| Rule | What it means |
|---|---|
| **`statusOk/Warn/Alarm/Fire` are RESERVED** | They only appear on alarm-state elements. Never as a CTA, never as a chart series fill, never as a decorative border. |
| **`statusMaintenance` is RESERVED** | Only on modules currently in maintenance state. Never as a generic "info" color. |
| **`statusSim` is intentionally similar to `accent`** | SIM is not an alarm. The banner uses this token. CTA buttons can sit alongside the SIM banner without color confusion. |
| **Domain colors `colorBess/Compute/Thermal/Grid/Pv/Revenue` are for measurement-display only** | A BESS card uses `colorBess` for its SoC ring. The same color must NOT appear on a Compute card. Domain color = system identity. |
| **Accent is for interactivity** | `accent` = CTA, active nav, focus ring. Not "look at this thing." |

**Hard test:** if you remove all color from a screen and look at it grayscale, every alarm element must still be identifiable by **shape + position + flash state** alone. Color is reinforcement, never the only signal.

---

## 2. Tokens, not values

| Rule | Why |
|---|---|
| **NEVER hardcode hex** in component code. Always `t.<token>` or `var(--token)`. | The grep test: `rg '#[0-9a-fA-F]{3,8}' packages/` should return zero hits inside `.tsx`/`.ts` component files. |
| **NEVER hardcode spacing/radius numbers.** Always `t.space[n]` / `t.radius[n]`. | Same. |
| **Type goes through `TYPE_RAMP`** via `resolveTypeStyle(t, role)`. No raw `fontSize: 14`. | Type ramp is the only place font decisions live. |
| **Adding a token** = update `tokens.ts`, both themes, regenerate. | Monochrome themes are not themes. |

---

## 3. Alarm visual contracts

These come from the design system review (DS-001 through DS-011, folded in below). Each is enforced in a component spec.

### 3.1 Two-step confirmation for every command (was DS-005)
All commands to physical hardware go through `ConfirmationModal`. No single loose button dispatches anything. A misclick must never command hardware.

### 3.2 Fire alarm pulses, not flashes (was DS-002)
`statusFire` elements pulse `opacity: 0.7 ↔ 1.0` over 800ms (`MOTION.duration.pulse`, `MOTION.easing.pulse`). **Never flash faster than 3Hz** (WCAG 2.3.1 — photosensitive seizure risk).

### 3.3 Flash is on the indicator, not the value (was DS-004)
For unacknowledged warn/alarm states, only the **indicator element** (`StatusBadge`, SLD node overlay, alarm row's leading dot) flashes opacity. The numeric value, card background, and row background **do not change color**. Hollifield §7.18 Method 3 — a flashing measurement is unreadable during a flood.

### 3.4 No-data is `"—"`, never `"0"` (was DS-003)
Zero is a valid measurement. Missing data is a distinct state.

| Primitive | No-data render |
|---|---|
| `Reading` | `"—"` in `textMid` |
| `Gauge` | empty arc (gray outline only, no text) |
| `RangeIndicator` | empty bar |
| `Indicator` | gray dot |
| `Mode` | `"—"`, no dot |

No clock glyph. No dimming. Offline is offline.

### 3.5 Fleet vs unit naming (was DS-007)
The status strip's `FLEET SoC`, `GPU UTIL`, `GRID` are fleet-level aggregates by definition. When a unit-level metric with the same name appears on a detail screen (e.g. a single BESS's SoC), it **must** carry a `UNIT` qualifier or the device display name.

### 3.6 Chart threshold + NOW marker (was DS-008)
Any chart visualizing a measurement with alarm thresholds in its class YAML **must** render those thresholds as dashed lines in `statusAlarm`, labeled `MIN` / `MAX`. Any chart with a live trailing edge **must** render a vertical dashed `NOW` marker in `textMid`. Without these, alarm values are uncalibrated and "now" is inferred from line geometry.

### 3.7 AC/DC voltage labeling (was DS-009)
Voltage on the battery DC side is `PACK V`. Voltage on the inverter/grid AC side is `BUS V`. Operators read 798 V on a screen that elsewhere shows 480 V; without an AC/DC qualifier the comparison is silently invalid. Same convention applies to Compute (PSU input AC vs. GPU rail DC) and Grid (PCS DC link vs. AC POI).

### 3.8 Interactive vs informational badges (was DS-010)
A `StatusBadge` is informational by default. A badge that navigates is a separate variant: trailing chevron glyph + `cursor: pointer` + focus ring + `onPress` handler (typecheck-enforced). **If a badge looks tappable it must do something; if it does something it must look tappable.**

### 3.9 Hero treatment goes to the least-familiar value (was DS-011)
When the same scalar appears multiple times on a screen, the largest visual weight goes to the **least familiar** value. On a faulted BESS detail page, the cell-voltage histogram (the diagnostic) is the hero. A giant SoC ring repeating a number the operator already saw twice is the slop signature of a dashboard that prioritized symmetry over cognition.

### 3.10 Alarm lifecycle is ISA-18.2-aligned

| State | Behavior |
|---|---|
| **Active, unacknowledged** | Indicator pulses; row in alarm panel; counted in chrome |
| **Active, acknowledged** | Row stays in panel; pulse stops; chrome count decrements |
| **Cleared** | Condition resolved; row moves to history |
| **Severity escalation while acknowledged** | Update the SAME row in place + re-pulse at new severity. **NEVER** spawn a duplicate row. |

Two rows for one device in one fault progression IS alarm flooding. The `AlarmRow` component must handle severity escalation as an in-place update, not an insert.

### 3.11 ISLAND mode excludes utility-side feeds from constraint surfaces
When the site is in ISLAND mode (`grid_module.mode == ISLAND`), DOE-derived metrics — headroom, envelope status, limit thresholds — are excluded from all constraint and dispatch surfaces. Strip `GRID` segment shows `ISLAND` only; Stranded Capacity skips the Grid row; BESS Controls `DOE HEADROOM` row shows a static `ISLAND MODE` label. Treating an islanded site as `GRID LIMITED` would be a category error. See `UTILITY-FEEDS.md` §6.

### 3.12 Alarm labels are indices, not diagnoses
Alarm row labels carry the device ID (consistent across all alarm types). Root-cause analysis ("is this our gear, the comms, or the utility?") lives in the **runbook** linked from the row, not in the label text. Specialized alarm origins (UTILITY, MAINTENANCE, etc.) appear as a small **category tag** alongside the device ID — never replacing it. The label is an index; the diagnosis is a decision tree.

### 3.13 Thresholds come from device templates, never hardcoded
Color transitions on ratio bars, alarm severity bands, gauge warn/alarm zones — all read their threshold values from the device template's `warn_min` / `warn_max` / `alarm_min` / `alarm_max` fields. A 500 kW deployment and a 50 MW deployment configure their own thresholds in YAML; the design just consumes them. Design must never hardcode a numeric threshold.

### 3.14 Event-driven measurements render as step-change, no smoothing
Measurements that update event-driven (DOE limits, breaker state, run mode) render as step-change lines on timeseries charts. **No interpolation between samples.** Flat plateau + vertical step IS the information. Smoothing implies gradual drift, which is a lie for event-driven values. Data gaps render as shaded regions or broken lines, never silently zero.

### 3.15 `/modules` shows operator-owned hardware only
`/modules` is filtered by `kind: module` (DTM field). `kind: leaf` devices — utility-side feeds (DOE, DLR, revenue meter), sub-component sensors — surface contextually elsewhere (SLD, alarm panel, headroom rows on consumer modules), never in the modules list. Adding them as a demoted section trains operators to skim.

---

## 4. Information density

This is an operational HMI, not a marketing surface. Visual weight is a finite resource.

| Rule | Concrete |
|---|---|
| Card padding `t.space[3]` (12px) or `t.space[4]` (16px), **never `space[5]`+** | A spacious card hides three rows the operator wanted to see. |
| Table row height 36–40px | Set `SIZE.tableRow = 38`. Use it. |
| KPI tile fits 3 values in 120px | The strip has to scan in one fixation. |
| One hero per screen (rule 3.9) | If you're tempted to add a second "look at me" element, you're hiding the real signal. |

Don't whitespace-pad. If a section feels empty, the design is wrong; don't fix it with content slop.

---

## 5. Motion + reduced-motion

| Rule | What it means |
|---|---|
| Live values **morph**, never flash or jump | `MOTION.duration.fast` (100ms) counter animation. No bg flash. |
| Alarm entry slides from top, `durationSlow` (350ms) | Existing items do not reflow. |
| `prefers-reduced-motion: reduce` is respected | All decorative motion disables. **Alarm pulses become a static state color + opacity step.** SLD particle flow becomes a static arrowhead. Information value must survive without motion. |
| No motion on non-data chrome | Don't bounce, parallax, or float buttons. |

---

## 6. Touch + accessibility

| Rule | Concrete |
|---|---|
| Minimum tap target **44×44 px** | `SIZE.touchTarget = 44`. WCAG 2.5.5. Below this is a bug. |
| Color is never the only signal | Every status color is paired with a distinct icon shape (caution triangle / warning octagon / flame). |
| Focus ring visible on all interactive elements | Uses `t.focusRing`, 2px outset, on every `Pressable` web fallback + every button. |
| Screen-reader names match the visible label | If a badge shows "BESS-02 · alarm", that's the ARIA label too. |
| Charts are decorative for AT | Provide a hidden `<table>` mirror or summary `aria-label`. The visual is power-user; the table is canonical. |

---

## 7. Responsive design order: phone → tablet → desktop → NOC TV (was DS-006)

The phone layout is the constraint. If it works at 390px it works everywhere. Each breakpoint **adds density and rearranges**; it does not introduce new content the smaller breakpoints lack.

| Breakpoint | Width | Notes |
|---|---|---|
| `xs` (phone) | < 480px | 4 cols, 16px gutter, bottom tabs |
| `sm` (tablet) | 480–1023px | 8 cols, 16px gutter, bottom tabs or side drawer |
| `lg` (desktop) | 1024–1599px | 12 cols, 24px gutter, left sidebar |
| `xl` (NOC TV) | ≥ 1600px | 12 cols, 32px gutter, hero KPIs scale up via `display` type role |

---

## 8. RN-Web cross-platform discipline

Shared components live in `packages/shared` and run on both web (via `react-native-web`) and mobile (RN native). Rules:

| Rule | Why |
|---|---|
| Use RN primitives in shared components: `<View>`, `<Text>`, `<Pressable>`, `StyleSheet` | `react-native-web` maps these to DOM. The reverse (using `<div>` and hoping RN supports it) does not work on mobile. |
| **Always specify `flexDirection` explicitly** | RN defaults to `column`, web to `row`. |
| **Text must be inside `<Text>`** | RN throws on bare strings inside `<View>`. |
| **No `cursor`, no `:hover`/`:focus` selectors** | Use `Pressable`'s state callback for web hover/press. |
| **No `position: fixed`** | Use `position: absolute` inside a parent pinned to viewport. |
| Web-only escape hatches go in `*.web.tsx` files | Platform extensions are Metro/Vite-resolved. |

---

## 9. Process

| Rule | Concrete |
|---|---|
| Re-read this constitution at the start of every session | One minute. Saves hours. |
| Before adding a token, search existing tokens for a semantic match | Most "new" colors are existing tokens needing a new alias. |
| Before adding a component, search `02-components/` for one that does 80% of it | Composition over duplication. |
| When a rule conflicts with a real need, **propose an exception in the component's `.md`** | Don't silently violate. |
| Every PR that touches `tokens.ts` re-generates `tokens.dtcg.json` + `tokens.css` and commits all three | Keeps consumers in sync. |
| Every PR that adds a component adds its `.md` and updates `02-components/index.html` gallery | Otherwise the spec rots. |

---

## 10. The "if in doubt" lookup

| Question | Answer |
|---|---|
| Can I use amber for a button highlight? | **No.** Amber = `statusWarn`. RESERVED. |
| Can I add a new color for "info" toasts? | Use `accent` or `statusSim`. If neither fits, raise it before adding a token. |
| The operator sees three SoC numbers on this screen — is that OK? | **No** — rule 3.5 + 3.9. One is `FLEET SoC` (strip), one is `UNIT SoC` (header), the third must be removed or demoted. |
| Can I flash a value to indicate it's new? | **No** — rule 3.3. Flash the indicator; let the value remain readable. |
| Can the chart skip the MIN/MAX threshold lines if they crowd the plot? | **No** — rule 3.6. The value is uncalibrated without them. |
| Can I make the BESS card glow blue on hover? | **No** — blue is `colorCompute`. Use `t.hoverOverlay`. |
| Can I add a token just for one component? | Only if the value will be reused. Otherwise, derive from existing via `withAlpha` or compose in the component. |
