# Utility-side feeds — DOE + DLR integration spec

> Companion to `00-constitution.md` and the per-component MDs in `02-components/`.
> Source: grilling session with HMI vet + backend dev, May 2026.

---

## Vocabulary (use exactly)

| Term | Meaning |
|------|---------|
| **Operating Envelope** / **DOE** | The utility's published authorization at the point of interconnection: how many watts you may import / export *right now*. Updates ~every 5 min, step-change (event-driven). |
| **Line Rating** / **Dynamic Line Rating** / **DLR** | The thermal ampacity of the conductor feeding the site. Real-time (1 Hz), updates continuously with weather. |
| **Headroom** | Gateway-derived margin: `import_headroom = import_limit − current_import`. Synthetic measurement. |
| **Utility-side feeds** | Collective name for `operating_envelope`, `line_rating`, `revenue_meter`. **NOT "modules."** |
| **Synthetic measurement** | Engineer-internal term for gateway-computed values. Operators don't see this word in UI copy. |

**Never say** in UI: "utility envelope," "grid permission," "import cap," "wire capacity," "feeder limit," "available capacity," "remaining import."

Display names (verbatim from YAML): `Import Limit`, `Export Limit`, `Dynamic Line Rating`, `Status`, `Module Import Headroom`, `Module Export Headroom`.

---

## The framing rule

> **DOE and DLR are dispatch constraints, not monitoring metrics.** They surface wherever the operator commits to a power value — and only there. They are never a standalone informational screen.

This shapes everything below.

---

## Surface integration — where utility-side data appears

### 1. Persistent status strip · GRID segment

Today the `GRID` segment shows `IMPORT / EXPORT / ISLAND`. Expand to **direction + headroom**:

| Site state | Render |
|------------|--------|
| Importing | `IMPORT  +3.2 MW` (signed magnitude — room remaining in active direction) |
| Exporting | `EXPORT  −1.8 MW` |
| ISLAND | `ISLAND` — no headroom number, no signed value |

- **Units:** kW or MW (display-layer decision based on magnitude). Auto-pick: `>= 1000 kW → MW`, else `kW`.
- **Sign convention:** matches every other power reading in the system (positive = import direction at POI).
- **Status non-OK** (STALE / INVALID / COMM_FAIL) → does NOT crowd the strip. Routes to alarm panel only. The strip continues to show the last known headroom.
- **ISLAND state** is detected from `grid_module.mode` (existing measurement), not from DOE. When ISLAND, DOE-derived headroom is *not applicable* (different from missing) — see §6.

### 2. Stranded Capacity panel (Overview Zone B2)

Today the panel is 3-way: `Power · Cooling · Runway`. **Expand to 4-way** by adding a `Grid` row:

```
┌─ CLUSTER HEADROOM ────────────────────  [BALANCED] ┐
│ Power     184 / 260 kW            ████████░░  71%  │
│ Cooling   38.4 / 49 °C (s04)      ████████▓░  78%  │
│ Runway    6.2 h at current load   ███████░░░  62%  │
│ Grid      3.2 / 5.0 MW IMP free   ███▓░░░░░░  36%  │  ← NEW
└────────────────────────────────────────────────────┘
```

**Math:**
- Grid row ratio bar = `(import_limit − import_headroom) / import_limit` = "% used" (so all four rows fill left-to-right same direction).
- Label shows residual headroom (`3.2 / 5.0 MW IMP free`); bar shows fill (the 36% empty IS the headroom).

**Thresholds:** read from device template `warn_min` / `warn_max` on the `import_limit` measurement. **Never hardcoded** in the design. A 500 kW deployment and a 50 MW deployment configure their own warn thresholds in the YAML; the panel just consumes them.

**State badge expansion:** when DOE status is non-OK, badge becomes a dual-token form. Design picks ONE of two options at commissioning (product call):

| Option | Render | Rationale |
|--------|--------|-----------|
| **A — Dual-token** | `GRID LIMITED · STALE` | Operator sees both: constraint position AND data quality |
| **B — Override** | `FEED STALE` | Can't meaningfully call something grid-limited without valid grid data |

Default recommendation: **B**. The constraint claim is degraded if its source is degraded.

**ISLAND state:** Grid row is **excluded** from the heaviest-constraint calc. Renders `—` and the state badge ignores it. A correctly islanded site must not always read as `GRID LIMITED`.

### 3. BESS Controls panel · DOE HEADROOM row

Add a labeled row **above the run-mode segmented control**:

```
┌─ CONTROLS · BESS-01 ──────────────────────────┐
│ DOE HEADROOM                                    │
│ IMP  3.2 MW          EXP  0.0 MW          OK   │  ← always both directions
│                                                 │
│ [ AUTO ] [ MANUAL ] [ TARGET SOC ]             │
│                                                 │
│ P SETPOINT             Q SETPOINT               │
│ [ −200 kW       ]      [ 0 kVAR        ]        │
│                                                 │
│ [   APPLY   ] [ RESET ]                         │
└─────────────────────────────────────────────────┘
```

- **Row label:** `DOE HEADROOM` (not bare `HEADROOM` — source attribution must be explicit at all times).
- **Both directions always shown** — even when `export_limit == 0`. The `EXP  0.0 MW` value is the entire point: it tells the operator the export cliff is right there before they switch to discharge.
- **Magnitudes unsigned** — `IMP`/`EXP` labels carry direction. Sign would be redundant noise.
- **Right-side state token:** `OK` (in `textSoft`) when nominal. Swaps to `STALE`/`INVALID`/`COMM_FAIL` in `statusWarn`/`statusAlarm` when degraded — natural elevation, no layout change.

**Envelope-fault behavior (configurable per deployment):**

| Mode | When DOE non-OK |
|------|-----------------|
| **Commercial / ISO** | `Apply` button blocks. Operator must acknowledge before proceeding. (FERC/ISO violation risk if dispatching outside envelope during COMM_FAIL.) |
| **Defense / sovereign / off-grid** | `Apply` uses conservative fallback limits (last known good DOE + configurable timeout → "no export, safe import ceiling"). Site keeps running; blocking the EMS is unacceptable. |

Banner above Controls panel during fault (both modes):

```
DOE HEADROOM · UTILITY FEED INVALID — limits unknown
```

**ISLAND state:** entire DOE HEADROOM row shows `ISLAND MODE · no utility coordination` — a single static label, not `—`. The cause is operationally meaningful, not missing data.

### 4. Energy screen · power balance chart

Add **DOE step-change history** as horizontal reference lines overlaid on the power balance chart:

- **Rendering:** `MIN` / `MAX` (= `export_limit` / `import_limit`) drawn as step-change historical lines in `statusAlarm`, dashed `4 3`, labeled `DOE IMPORT LIMIT 5.0 MW` and `DOE EXPORT LIMIT 0.0 MW`.
- **No interpolation, no smoothing.** Flat plateau followed by vertical step IS the information. Utilities push new envelopes event-driven, not on a schedule. A smooth curve would imply gradual drift, which is wrong.
- **DOE fault gaps**: when status was non-OK in the historical window, render the gap as a **shaded region** or **broken line** — never silently zero, never interpolated. "We had no envelope data for 20 minutes at 14:00" must read as a fact in the chart.
- **Optional forward projection** (design iteration option, not required): a thin `CURRENT LIMIT` line extending ~60 min past `NOW`, labeled clearly as "current limit," NOT "forecast." Same visual treatment as the historical line but visually distinct from the historical record.

**Do NOT** put DLR on this chart. Different unit (amps), different conceptual question. DLR lives on the SLD (where it constrains the physical conductor) and on Grid module detail (where amps belong with the other AC measurements). Mixing amps + MW on one chart is the slop trap.

**Export-active edge case:** when `export_limit > 0` in a deployment AND the site is actively exporting, surface DOE limits prominently on the **Active Dispatch card** in the Energy screen. The default `export_limit: 0` makes this rare today, but the chart spec must accommodate it.

### 5. SLD · top-of-diagram

The revenue meter is the POI — surface it explicitly as an SLD node. The DLR badge attaches to the conductor itself (mid-line). Two badges, two locations, two label anchors.

```
        UTILITY · 13.2 kV
              │
              │
            DLR  ●                ← persistent dot + label anchor
              │
              │
        ╔═══════════════════════╗
        ║ GRD-RM-001             ║   ← revenue meter node
        ║ +142 kW IMPORT         ║   ← settlement reading (primary)
        ║ ─────────              ║
        ║ DOE   OK               ║   ← state row (secondary, kpiLabel)
        ╚═══════════════════════╝
              │
       500 kVA transformer
              │
           MAIN · CLOSED
              │
            480 V BUS
              ⋮
```

**Revenue meter node:**
- Shows `+142 kW IMPORT` — signed value AND the explicit direction word. This is the settlement number that goes to CAISO; earns slightly more visual weight than internal-module kW readings (use `kpiValue` ramp, not `monoData`).
- Below: `DOE   OK` row using `kpiLabel` for `DOE` and `textSoft` for `OK`. When state goes non-OK, `OK` → `STALE` / `INVALID` / `COMM_FAIL` in `statusWarn` / `statusAlarm` — color elevation, no layout change.
- Tap the meter node → read-only detail view. (Settlement discrepancy investigation enters here. The Modules list never shows the meter.)

**DLR mid-conductor badge — three visual states:**

| State | Render |
|-------|--------|
| **Nominal** | Collapsed: tiny muted-`statusOk` dot + `DLR` label. No number. (Confirms "feed present, healthy.") |
| **Operational warning** (draw approaching threshold) | Expanded: `DLR 94%` — severity dot + ratio. |
| **Status fault** (STALE / INVALID / COMM_FAIL) | Expanded: `DLR ⚠ STALE` — severity dot + sensor-fault glyph + state token. No ratio (rating unknown). |

**Why three states (not two):** an operator sees `DLR 94%` and knows to watch the line; sees `DLR ⚠ STALE` and knows the EMS is flying blind on capacity. Two different responses; the badge must distinguish.

**Label anchors are mandatory** — `DLR` and `DOE` rendered always (in `kpiLabel` ramp). They serve two purposes simultaneously:
1. **Distinguishability** — DLR badge mid-conductor and DOE badge in meter node card are physically adjacent on the SLD. The labels prevent them from visually merging.
2. **Feed presence** — on a deployment without DLR (e.g. off-grid, no utility coordination), the `DLR` label and dot simply don't render. Operator learns: presence of label = feature implemented; absence = not configured.

**Conductor rendering:**
- Color stays `colorGrid` (Rule 1 — domain color = identity, never alarm).
- Particle flow unchanged — speed proportional to `|kW|` (already in SLD spec).
- **No stroke-width modulation, no color shift on threshold.** Particles encode magnitude; badge encodes threshold. One variable, one encoding. Adding a third would force the operator to learn which to trust when they disagree.

### 6. `/modules` list

Utility-side feeds **do NOT appear** in `/modules`. The list is filtered by `kind: module` (DTM field, already exists). `kind: leaf` devices (`operating_envelope`, `line_rating`, `revenue_meter`) are excluded automatically — no hand-maintained name list.

Rationale:
- Operators don't own, control, or maintain utility-side feeds.
- Adding them (even demoted) would be a section operators learn to ignore, teaching them to skim. Wrong habit for an EMS.
- All operator-relevant information already routes elsewhere: status → alarm panel; headroom → strip + BESS Controls + Stranded Capacity; settlement → SLD meter node detail view.

**Revenue meter exception:** read-only detail view exists. Entry point is **SLD only** (tap the meter node). Not `/modules`.

### 7. Alarm panel (Overview Zone D + global)

DOE/DLR status non-OK feeds the existing alarm panel — same component, same flow, same ack semantics.

**Row format:**
```
GRD-RM-001 · DOE feed STALE · 4m ago   [Ack]   UTILITY
COMP-S04   · CDU outlet rising · 38.4 °C · 17m ago   [Ack]
BESS-02    · Cell voltage spread · 0.142 V · 4m ago  [Ack]
```

- Device ID in the row label (consistent with all other alarms).
- Optional **`UTILITY` category tag** on the right — visually demoted, same treatment as other alarm category tags. Does NOT replace the device ID.
- **Runbook button** links to a *utility coordination runbook* (vs. maintenance runbook for internal alarms). Root-cause diagnosis lives in the runbook decision tree, not in the alarm label.

**Severity mapping** (from device template `x-severity`, see §8):

| Status | Severity | Why |
|--------|----------|-----|
| `OK` | none | nominal |
| `STALE` | warn | degraded-but-functional; data probably roughly right |
| `INVALID` | alarm | sensor data rejected; do not trust limits |
| `COMM_FAIL` | alarm | no comms; limits unknown; possible upstream escalation |

**No fire-tier escalation for sustained COMM_FAIL.** Fire is physical hazard only.

**Future-watch (post-MVP):** when `export_limit > 0` in a real deployment AND active export is happening, COMM_FAIL warrants dedicated alarm text — `DOE feed COMM_FAIL — export active, limits unknown`. Not MVP (default export_limit: 0), but the alarm component should accommodate it.

---

## ISLAND mode — unified rule

When `grid_module.mode == ISLAND`, DOE headroom is **excluded** from all constraint surfaces:

| Surface | Behavior |
|---------|----------|
| Strip `GRID` segment | Shows `ISLAND` only. No headroom number. |
| Stranded Capacity `Grid` row | Excluded from heaviest-constraint calc; row collapses or renders `—`. Badge ignores Grid. |
| BESS Controls `DOE HEADROOM` row | Static label: `ISLAND MODE · no utility coordination`. Not `—`. |
| SLD DOE badge | Persistent `DOE` label remains; state token shows `ISLAND` in `textSoft`. |
| Energy chart | DOE reference lines persist (last known good); the period-since-ISLAND-entered renders as a fault gap, same as STALE/COMM_FAIL gaps. |
| Alarm panel | DOE feeds going non-OK during ISLAND do not raise alarms — they would be noise. |

The distinction from `—` (no-data) elsewhere is semantic: ISLAND is *intentional*, not *missing*. The operator must see "this is correct system behavior," not "there's a fault here."

---

## Configurable per deployment

These are commissioning parameters, not design constants:

| Parameter | Where set | Effect |
|-----------|-----------|--------|
| `import_limit.warn_min/warn_max`, `export_limit.warn_min/warn_max` | device template YAML | Threshold color transitions in Stranded Capacity bar + alarm severity |
| `dynamic_line_rating.warn_min/warn_max` | device template YAML | DLR mid-conductor badge expansion threshold |
| DLR feed implemented (yes/no) | deployment config | If absent: DLR label and badge don't render anywhere |
| DOE feed implemented (yes/no) | deployment config | If absent: DOE row hidden in BESS Controls + Strip GRID segment falls back to direction-only |
| `Apply`-during-fault behavior | deployment config | Commercial/ISO: block; Defense/off-grid: conservative fallback |
| Stranded Capacity badge mode during DOE non-OK | deployment config | Dual-token (`GRID LIMITED · STALE`) or override (`FEED STALE`). Default: override. |

---

## Design system rules — generalized from this spec

These are NOT DOE-specific. They apply to every alarm, every constraint surface, every alarm row component:

### Rule 3.10 — Alarm lifecycle (ISA-18.2 alignment)

| Lifecycle state | Behavior |
|-----------------|----------|
| **Active, unacknowledged** | Row pulses; in alarm panel; routed to chrome alarm count |
| **Active, acknowledged** | Row stays in panel, pulse stops; chrome alarm count decrements |
| **Cleared** | Condition resolved; row moves to history |
| **Severity escalation while acknowledged** | Update the SAME row's severity in place + re-pulse at new severity. **NEVER** spawn a duplicate row. |

Two rows for one device in one fault progression is alarm flooding. The component MUST handle severity escalation as an update, not an insert.

### Rule 3.11 — ISLAND mode excludes utility-side constraints

When the site is in ISLAND mode, DOE-derived metrics (headroom, envelope status, limit thresholds) are excluded from all constraint and dispatch surfaces. The ISLAND label appears in the strip and the BESS Controls DOE row; the constraint comparison panel skips the Grid row.

### Rule 4.1 — Alarm labels are indices, not diagnoses

Alarm row labels carry the **device ID** consistent across all alarm types. Root-cause analysis ("is this our gear, the comms, or the utility?") lives in the **runbook** linked from the row, not in the label text. The label is an index for the operator to navigate to context; the diagnosis is a decision tree that lives elsewhere.

### Rule 4.2 — `/modules` shows operator-owned hardware only

`/modules` is filtered by `kind: module` (DTM field). `kind: leaf` devices (utility-side feeds, sub-component sensors, etc.) surface contextually elsewhere — never in the modules list. Adding them as a demoted section trains operators to skim.

### Rule 4.3 — Thresholds come from device templates

Color transitions on ratio bars, alarm severity bands, and gauge warn/alarm zones read their threshold values from the device template's `warn_min` / `warn_max` / `alarm_min` / `alarm_max` fields. **Never hardcoded** in the design. A 500 kW deployment and a 50 MW deployment honestly reflect their own commissioned thresholds.

### Rule 4.4 — Charts of event-driven measurements: no smoothing

Measurements that update event-driven (DOE limits, breaker state, run mode) render as step-change lines on time series charts. **No interpolation between samples.** Flat plateau + vertical step IS the information. Smoothing implies gradual drift, which is a lie for event-driven values.

---

## What's NOT in scope (and why)

- **Reactive power limits** — DOE MVP is active power only. No Q-side envelope.
- **Voltage / frequency envelopes** — not in the operating_envelope template.
- **Per-feeder DLR** — single conductor, single DLR feed in MVP.
- **DOE forecast** — the utility doesn't publish forward envelope; we render current value extending forward only as a clearly-labeled "current limit" line, never "forecast."
- **Multiple POIs** — single point of interconnection per deployment in MVP.

These are documented for future-watch but no design work is needed today.

---

## Implementation references

- Templates: `edp-api/device_templates/leaf/operating_envelope.yaml`, `line_rating.yaml`, `revenue_meter.yaml`
- Origin handoff: `uploads/HANDOFF_doe_designer.md` (the utility engineer's brief that started this)
- Constitution rules touched: 1, 3.4, 3.5, 3.6, 3.7, 3.10 (new), 3.11 (new), 4.1–4.4 (new)
- Component MDs that need updates: `SLDDiagram.md`, `StatusBadge.md`, `AlarmRow.md`
- New component MD to add: `DOEHeadroomRow.md` (composable row used in 3 surfaces)
