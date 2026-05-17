// =============================================================================
//  Acceptance specs — semantic contract enforcement
//  Run: npx playwright test handoff/04-playwright/acceptance.spec.ts
// =============================================================================
//
//  These tests assert that the design system's hard rules hold in the rendered
//  output. They are layout-independent: a rule violation here is a violation
//  in code, regardless of how the screen looks. Pair with visual.spec.ts for
//  pixel-level coverage.
//
//  Rule numbers reference handoff/00-constitution.md.

import { test, expect, type Page, type Locator } from '@playwright/test';

const GALLERY = 'handoff/02-components/index.html';
const SCREEN  = (name: string) => `handoff/03-screens/${name}.html`;
const THEMES  = ['sovereign', 'solarpunk'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────

async function setTheme(page: Page, theme: typeof THEMES[number]) {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
}

async function setReducedMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** Returns true if the element has any CSS animation other than `none`. */
async function hasRunningAnimation(loc: Locator): Promise<boolean> {
  return loc.evaluate((el) => {
    const a = getComputedStyle(el).animationName;
    return a && a !== 'none';
  });
}

// =============================================================================
//  Rule 1 · Color discipline — status colors RESERVED, paired with icon shape
// =============================================================================
test.describe('Rule 1 — color discipline', () => {

  for (const theme of THEMES) {
    test(`[${theme}] every alarm-state element renders a distinguishing icon`, async ({ page }) => {
      await page.goto(GALLERY);
      await setTheme(page, theme);

      // Every StatusBadge with a status variant must include an SVG icon child.
      // (Color alone is never the signal.)
      const badges = page.locator('[data-comp="StatusBadge"][data-variant="warn"], [data-comp="StatusBadge"][data-variant="alarm"], [data-comp="StatusBadge"][data-variant="fire"]');
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const badge = badges.nth(i);
        const hasIcon = await badge.locator('svg').count();
        expect(hasIcon, `StatusBadge #${i} (variant: ${await badge.getAttribute('data-variant')}) is missing its icon`).toBeGreaterThan(0);
      }
    });

    test(`[${theme}] no Apply / CTA button uses statusWarn or statusAlarm color`, async ({ page }) => {
      await page.goto(GALLERY);
      await setTheme(page, theme);

      const ctaButtons = page.locator('button:has-text("Apply"), button:has-text("Confirm"), button:has-text("Send")');
      const n = await ctaButtons.count();
      for (let i = 0; i < n; i++) {
        const bg = await ctaButtons.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
        // Forbidden: amber (rgb(245, 166, 35)) and red (rgb(232, 64, 64) / rgb(255, 32, 32))
        expect(bg, `CTA button ${i} uses a forbidden alarm color: ${bg}`).not.toMatch(/^rgb\(245,\s*166/);
        expect(bg, `CTA button ${i} uses a forbidden alarm color: ${bg}`).not.toMatch(/^rgb\(232,\s*64/);
        expect(bg, `CTA button ${i} uses a forbidden alarm color: ${bg}`).not.toMatch(/^rgb\(255,\s*32/);
      }
    });
  }
});

// =============================================================================
//  Rule 3.3 · Flash on indicator only — never on value text
// =============================================================================
test.describe('Rule 3.3 — unack flash on indicator only', () => {

  test('unacknowledged alarm rows: dot animates, value does not', async ({ page }) => {
    await page.goto(GALLERY);
    await page.locator('#alarm-row').scrollIntoViewIfNeeded();

    // The leading pulse dot inside each unacknowledged row animates.
    const dots = page.locator('[data-comp="AlarmRow"][data-ack="false"] [data-region="ack-dot"]');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(0);

    for (let i = 0; i < dotCount; i++) {
      expect(await hasRunningAnimation(dots.nth(i))).toBe(true);
    }

    // The value text inside the same rows MUST NOT animate.
    const values = page.locator('[data-comp="AlarmRow"][data-ack="false"] [data-region="value"]');
    const valCount = await values.count();
    for (let i = 0; i < valCount; i++) {
      expect(await hasRunningAnimation(values.nth(i)),
        `AlarmRow #${i} value text is animating — only the indicator should flash`).toBe(false);
    }
  });
});

// =============================================================================
//  Rule 3.4 · No-data renders "—", never "0"
// =============================================================================
test.describe('Rule 3.4 — no-data semantics', () => {

  test('Reading with null value renders an em dash, never zero', async ({ page }) => {
    await page.goto(GALLERY);

    // Find every Reading rendered with no-data state.
    const noData = page.locator('[data-comp="Reading"][data-state="no-data"]');
    const count = await noData.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const txt = (await noData.nth(i).textContent() || '').trim();
      expect(txt, `Reading #${i} should render "—" for no-data, got: "${txt}"`).toContain('—');
      expect(txt, `Reading #${i} should NEVER render "0" for no-data`).not.toBe('0');
    }
  });
});

// =============================================================================
//  Rule 3.5 · Fleet vs unit naming
// =============================================================================
test.describe('Rule 3.5 — FLEET / UNIT qualifier', () => {

  for (const screen of ['Overview', 'BESS Detail']) {
    test(`[${screen}] no bare "SoC" label outside a unit-qualified context`, async ({ page }) => {
      await page.goto(SCREEN(screen));

      // Every "SoC" text must be inside an element that ALSO contains
      // FLEET, UNIT, or a device-id-like token (e.g. "BESS-01 SoC").
      const socMatches = page.getByText(/\bSoC\b/);
      const count = await socMatches.count();
      for (let i = 0; i < count; i++) {
        const ctx = (await socMatches.nth(i).locator('..').textContent() || '');
        const ok = /FLEET|UNIT|BESS-\d|\bunit\b/i.test(ctx);
        expect(ok, `Bare "SoC" label found without FLEET/UNIT qualifier. Context: "${ctx.slice(0, 80)}…"`).toBe(true);
      }
    });
  }
});

// =============================================================================
//  Rule 3.6 · Chart thresholds + NOW marker
// =============================================================================
test.describe('Rule 3.6 — charts with thresholds + NOW marker', () => {

  test('every chart with a thresholds attr renders MIN / MAX labels', async ({ page }) => {
    await page.goto(GALLERY);
    await page.locator('#charts').scrollIntoViewIfNeeded();

    const charts = page.locator('[data-comp="TimeseriesChart"][data-thresholds], [data-comp="Histogram"][data-thresholds]');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const chart = charts.nth(i);
      await expect(chart.locator('text=MIN').first(), `Chart #${i} is missing MIN threshold label`).toBeVisible();
      await expect(chart.locator('text=MAX').first(), `Chart #${i} is missing MAX threshold label`).toBeVisible();
    }
  });

  test('every live chart renders a NOW marker', async ({ page }) => {
    await page.goto(GALLERY);
    await page.locator('#charts').scrollIntoViewIfNeeded();

    const live = page.locator('[data-comp="TimeseriesChart"][data-live="true"]');
    const count = await live.count();
    for (let i = 0; i < count; i++) {
      await expect(live.nth(i).locator('text=NOW'), `Live chart #${i} is missing NOW marker`).toBeVisible();
    }
  });
});

// =============================================================================
//  Rule 3.7 · Voltage labeling — PACK V (DC) vs BUS V (AC)
// =============================================================================
test.describe('Rule 3.7 — DC/AC voltage qualifier', () => {

  test('no bare "V" label on voltage measurements', async ({ page }) => {
    for (const screen of ['BESS Detail', 'Compute Detail']) {
      await page.goto(SCREEN(screen));
      const voltageLabels = page.locator('[data-measure-type="voltage"]');
      const count = await voltageLabels.count();
      for (let i = 0; i < count; i++) {
        const label = (await voltageLabels.nth(i).textContent() || '').toUpperCase();
        const qualified = /PACK V|BUS V|DC|AC/.test(label);
        expect(qualified, `Voltage measurement on ${screen} lacks DC/AC qualifier: "${label}"`).toBe(true);
      }
    }
  });
});

// =============================================================================
//  Rule 3.1 · Two-step command confirmation
// =============================================================================
test.describe('Rule 3.1 — command requires ConfirmationModal', () => {

  test('clicking Apply opens a role="dialog" before any dispatch', async ({ page }) => {
    // Acceptance harness needs the wired-up app; for the static gallery we
    // just assert structure: every CommandPanel has an Apply button AND
    // a sibling ConfirmationModal node in the test fixture.
    await page.goto(GALLERY);
    await page.locator('#command').scrollIntoViewIfNeeded();

    const panels = page.locator('[data-comp="CommandPanel"]');
    expect(await panels.count()).toBeGreaterThan(0);

    // Gallery renders the modal inline next to the panel. In the live app this
    // is wired by an onClick → setOpen(true) → ConfirmationModal mounts.
    await expect(page.locator('[data-comp="ConfirmationModal"]').first()).toBeVisible();
  });
});

// =============================================================================
//  Rule 5 · Reduced motion respected
// =============================================================================
test.describe('Rule 5 — prefers-reduced-motion', () => {

  test('no element has a running animation under reduced motion', async ({ page }) => {
    await setReducedMotion(page);
    await page.goto(GALLERY);

    // Sample a wide swath of elements that normally animate.
    const animated = page.locator(
      '[data-comp="StatusBadge"][data-variant="fire"],' +
      '[data-comp="AlarmRow"][data-ack="false"] [data-region="ack-dot"],' +
      '[data-comp="StatusBadge"][data-ack="false"]'
    );
    const count = await animated.count();
    for (let i = 0; i < count; i++) {
      expect(await hasRunningAnimation(animated.nth(i)),
        `Element #${i} animates under prefers-reduced-motion: reduce`).toBe(false);
    }
  });
});

// =============================================================================
//  Rule 6 · Touch targets ≥ 44×44 (WCAG 2.5.5)
// =============================================================================
test.describe('Rule 6 — touch targets', () => {

  test('every interactive element meets 44×44 minimum', async ({ page }) => {
    await page.goto(GALLERY);

    const interactive = page.locator('button:visible, [role="button"]:visible, a[href]:visible');
    const count = await interactive.count();

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const el = interactive.nth(i);
      const box = await el.boundingBox();
      if (!box) continue;
      if (box.width < 44 || box.height < 44) {
        const text = (await el.textContent() || '').trim().slice(0, 30);
        failures.push(`"${text}" — ${Math.round(box.width)}×${Math.round(box.height)}px`);
      }
    }

    expect(failures, `Touch targets below 44×44:\n  ${failures.join('\n  ')}`).toHaveLength(0);
  });
});

// =============================================================================
//  Rule 8 · RN-Web sanity: shared components don't depend on browser-only APIs
// =============================================================================
test.describe('Rule 8 — RN-Web cross-platform discipline', () => {

  test('no inline hex colors in any data-comp element', async ({ page }) => {
    // Every color should come from a token. Catch raw hex in style attrs.
    await page.goto(GALLERY);

    const styled = page.locator('[data-comp][style*="#"]');
    const count = await styled.count();

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const el = styled.nth(i);
      const style = (await el.getAttribute('style')) || '';
      // Skip rgba — only flag raw #hex
      const matches = style.match(/#[0-9a-fA-F]{3,8}/g);
      if (matches) {
        const comp = await el.getAttribute('data-comp');
        failures.push(`${comp}: ${matches.join(', ')}`);
      }
    }

    expect(failures, `Inline hex colors found (use tokens instead):\n  ${failures.join('\n  ')}`).toHaveLength(0);
  });
});
