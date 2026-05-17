# Playwright Specs

Two suites:

| File | Purpose | Run frequency |
|------|---------|---------------|
| `acceptance.spec.ts` | **Semantic.** Asserts the design contract: labels exist, FLEET vs UNIT naming holds, ack flow works, command requires confirmation, no-data renders "—", reduced-motion respected. Fast. | Every PR |
| `visual.spec.ts` | **Pixel.** Screenshots every component state and screen, diffs against committed baselines. Slow, but catches drift no semantic test can see. | Every PR + nightly |

Both suites consume the same fixtures: the gallery in `02-components/index.html` and the screen mocks in `03-screens/`. When the spec changes, re-baseline:

```sh
npx playwright test visual.spec.ts --update-snapshots
git add **/*-baseline.png
```

---

## Install

Playwright is already a dep in `packages/web` (per `package.json`). Add this folder's specs to the `playwright.config.ts` test glob or run them directly:

```sh
npx playwright test handoff/04-playwright/
```

---

## What's tested

### Acceptance (semantic)

- **Status strip** — every label includes `FLEET` / `GPU UTIL` / `GRID` qualifier; no bare "SoC" anywhere outside a unit context (Rule 3.5).
- **Status badges** — every alarm-state element has a paired icon (color is never the only signal) (Rule 1).
- **Alarm flash** — unacknowledged alarms have a `pulse` animation on the indicator only; value text has no animation (Rule 3.3).
- **No-data** — searches for any `Reading`-typed element showing `"0"` when its data attr is `"missing"` — fails if found (Rule 3.4).
- **Command flow** — clicking "Apply" on a CommandPanel opens a `role="dialog"` before any MQTT publish.
- **SIM mode** — when `data-sim-mode="true"` on root: (a) the global SIM banner is present at top of viewport, and (b) every open `ConfirmationModal` renders a full-width SIMULATED band (`[data-comp="ConfirmationModal"] [data-region="sim-band"]`) using `statusSim`. Command buttons (Apply, Send, Confirm) MUST NOT carry a `(SIM)` text suffix and MUST NOT be tinted `statusSim`. Amendment locked 2026-05-16.
- **Reduced motion** — with `prefersReducedMotion: 'reduce'`, no element has a running CSS animation.
- **Charts** — every `TimeseriesChart` and `Histogram` with a `data-thresholds` attribute renders `MIN`/`MAX` labels inside its SVG (Rule 3.6).
- **NOW marker** — every live `TimeseriesChart` (with `data-live="true"`) renders a `NOW` label.
- **Touch targets** — every `<button>` and `Pressable` web fallback has `width >= 44 && height >= 44` (Rule 6 / WCAG 2.5.5).
- **Voltage labels** — anywhere `data-measure-type="voltage"` appears, it carries either `PACK V` (DC) or `BUS V` (AC) — never bare "V" (Rule 3.7).

### Visual (pixel)

- Each section of the component gallery, screenshotted at 1440×900.
- Each screen mock at its native breakpoint (380×820 phone, 1280×720 desktop), both themes.
- Diff threshold: 0.2% pixels (Playwright default for `toHaveScreenshot`).
- Mask any time-varying regions: clock text, sparkline tails, the `NOW` marker position.

---

## Adding a new test

1. **Acceptance test for a new component:** add a section to `acceptance.spec.ts` under the appropriate `describe`. Use the gallery URL with `?focus=ComponentName` anchor.
2. **Visual baseline for a new component:** ensure the gallery has a section for it; the visual spec picks it up automatically via the `data-screen-label` attr.
3. **Screen mock:** add it to `03-screens/index.html` and to the `screens` array in `visual.spec.ts`.

---

## Wiring `data-*` hooks

Components emit several `data-*` attributes the specs hook into. None of these affect rendering — they're test-only contracts. Standardized:

| Attr | On | Used by |
|------|-----|---------|
| `data-comp` | every component root | both suites — to locate a component by name |
| `data-state` | components with state | acceptance — assert correct state class |
| `data-screen-label` | top-level screen wrappers | visual — group screenshots |
| `data-measure-type` | measurement-rendering elements | acceptance — voltage label rule (3.7) |
| `data-thresholds` | charts | acceptance — MIN/MAX label check |
| `data-live` | live trailing-edge charts | acceptance — NOW marker check |
| `data-sim-mode` | root when SIM banner active | acceptance — global banner present + ConfirmationModal SIMULATED band present; command buttons MUST NOT carry `(SIM)` text |
| `data-ack-state` | alarm elements | acceptance — flash animation check |

These get added to the existing components when the engineer ports them out of `tokens.jsx`/`overview-screen.jsx` etc. into the real shared package. They're cheap (no runtime cost, just attributes) and make the test suite robust to refactors.
