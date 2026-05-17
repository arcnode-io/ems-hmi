// =============================================================================
//  Visual specs — pixel-level baseline diffs
//  Run: npx playwright test handoff/04-playwright/visual.spec.ts
//  Re-baseline: append `--update-snapshots`
// =============================================================================
//
//  Captures the component gallery and every screen mock at both themes.
//  Time-varying regions (clocks, sparkline tails, NOW markers) are masked.
//
//  Threshold: Playwright's `toHaveScreenshot` default of 0.2% pixels.

import { test, expect, type Page } from '@playwright/test';

const GALLERY = 'handoff/02-components/index.html';
const THEMES  = ['sovereign', 'solarpunk'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────

async function setTheme(page: Page, theme: typeof THEMES[number]) {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
}

async function waitForFonts(page: Page) {
  await page.evaluate(() => (document as any).fonts?.ready);
}

// =============================================================================
//  Component gallery — one screenshot per section, per theme
// =============================================================================

const sections = [
  // Tier 0 primitives
  'reading', 'indicator', 'mode', 'gauge', 'range-indicator',
  // Tier 1
  'status-badge', 'kpi-tile', 'section-header', 'module-card', 'alarm-row',
  // Tier 2
  'measurement-row', 'gpu-heatmap', 'command',
  // Tier 3
  'charts', 'analyst',
  // Cross-cutting
  'typography', 'elevation',
];

test.describe('Component gallery — visual baselines', () => {

  for (const theme of THEMES) {
    for (const section of sections) {

      test(`gallery · ${section} · ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(GALLERY);
        await setTheme(page, theme);
        await waitForFonts(page);

        const target = page.locator(`#${section}`);
        await target.scrollIntoViewIfNeeded();
        // Settle animations / streaming
        await page.waitForTimeout(500);

        await expect(target).toHaveScreenshot(`gallery-${section}-${theme}.png`, {
          // Mask any animated indicators within the section
          mask: [
            page.locator('[data-comp="StatusBadge"][data-variant="fire"]'),
            page.locator('[data-region="ack-dot"]'),
            page.locator('text=NOW'),
          ],
          maxDiffPixelRatio: 0.002,
        });
      });

    }
  }
});

// =============================================================================
//  Full screens — one screenshot per mock, native breakpoint
// =============================================================================

interface ScreenSpec {
  name: string;
  file: string;
  viewport: { width: number; height: number };
}

const screens: ScreenSpec[] = [
  { name: 'overview-phone',         file: 'Overview.html',                viewport: { width: 1280, height: 900 } },
  { name: 'overview-desktop',       file: 'Overview Desktop.html',        viewport: { width: 1440, height: 900 } },
  { name: 'modules-phone',          file: 'Modules.html',                 viewport: { width: 1280, height: 900 } },
  { name: 'modules-desktop',        file: 'Modules Desktop.html',         viewport: { width: 1440, height: 900 } },
  { name: 'sld-phone',              file: 'SLD.html',                     viewport: { width: 1280, height: 900 } },
  { name: 'sld-desktop',            file: 'SLD Desktop.html',             viewport: { width: 1440, height: 900 } },
  { name: 'bess-detail-phone',      file: 'BESS Detail.html',             viewport: { width: 1280, height: 900 } },
  { name: 'bess-detail-desktop',    file: 'BESS Detail Desktop.html',     viewport: { width: 1440, height: 900 } },
  { name: 'compute-detail-phone',   file: 'Compute Detail.html',          viewport: { width: 1280, height: 900 } },
  { name: 'compute-detail-desktop', file: 'Compute Detail Desktop.html',  viewport: { width: 1440, height: 900 } },
  { name: 'energy-phone',           file: 'Energy Detail.html',           viewport: { width: 1280, height: 900 } },
  { name: 'energy-desktop',         file: 'Energy Detail Desktop.html',   viewport: { width: 1440, height: 900 } },
  { name: 'analyst-phone',          file: 'Analyst.html',                 viewport: { width: 1280, height: 900 } },
  { name: 'analyst-desktop',        file: 'Analyst Desktop.html',         viewport: { width: 1440, height: 900 } },
];

test.describe('Screens — full-page baselines', () => {

  for (const s of screens) {
    test(`screen · ${s.name}`, async ({ page }) => {
      await page.setViewportSize(s.viewport);
      await page.goto(s.file);
      await waitForFonts(page);
      await page.waitForTimeout(800);

      await expect(page).toHaveScreenshot(`screen-${s.name}.png`, {
        fullPage: true,
        mask: [
          // Time-varying / animated regions
          page.locator('[data-region="ack-dot"]'),
          page.locator('[data-comp="StatusBadge"][data-variant="fire"]'),
          page.locator('text=NOW'),
          page.locator('text=/\\d+m ago/'),
          page.locator('text=/\\d+h \\d+m ago/'),
          page.locator('text=/just now/i'),
        ],
        maxDiffPixelRatio: 0.003,
      });
    });
  }
});

// =============================================================================
//  Token sanity — one screenshot of each token group for design-review
// =============================================================================

test.describe('Tokens — visual reference', () => {

  for (const theme of THEMES) {
    test(`tokens · typography · ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 900 });
      await page.goto(GALLERY);
      await setTheme(page, theme);
      await waitForFonts(page);

      const target = page.locator('#typography');
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await expect(target).toHaveScreenshot(`tokens-typography-${theme}.png`);
    });

    test(`tokens · elevation · ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 600 });
      await page.goto(GALLERY);
      await setTheme(page, theme);
      await waitForFonts(page);

      const target = page.locator('#elevation');
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await expect(target).toHaveScreenshot(`tokens-elevation-${theme}.png`);
    });
  }
});
