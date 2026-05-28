/**
 * Smoke test — visits every tab + asserts no console errors. Guards against
 * regressions when porting new screens or refactoring shared components.
 *
 * The legacy template tests in this dir (healthcheck/chat/call-api) target a
 * different app shell and need replacement; this is the new baseline.
 */

import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const TABS: Array<{ tab: string; marker: RegExp }> = [
  { tab: "Overview", marker: /All systems nominal|active alarm|active warning/i },
  { tab: "Modules", marker: /Single line diagram/i },
  { tab: "Energy", marker: /Dispatch · Markets|Revenue today/i },
  { tab: "Compute", marker: /Cluster · GPUs · Thermal|GPU heatmap/i },
  { tab: "Analyst", marker: /Ask about devices|Try one of these/i },
];

interface ErrorCollector {
  errors: string[];
  warnings: string[];
}

/**
 * Attach console + page error listeners to `page` and return their buffers.
 * Filters benign deprecation noise + expected static-fixture 404s downstream.
 */
function collectErrors(page: Page): ErrorCollector {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
    if (msg.type() === "warning") warnings.push(msg.text());
  });
  page.on("pageerror", (err: Error) => errors.push(`pageerror: ${err.message}`));
  return { errors, warnings };
}

const IGNORE_PATTERN = /shadow.*deprecated|HTTP 404 fetching .*sld(-portrait)?\.svg/i;

test.describe("phone smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("every BottomTab renders without console errors", async ({ page }) => {
    const { errors } = collectErrors(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    for (const { tab, marker } of TABS) {
      await page.locator(`[aria-label="${tab}"]`).first().click();
      // Reason: React-Navigation keeps prior screens mounted, so toBeVisible
      // false-positives. toBeAttached just checks DOM presence.
      await expect(page.getByText(marker).first()).toBeAttached({ timeout: 5000 });
    }

    const meaningful = errors.filter((err) => !IGNORE_PATTERN.test(err));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });
});

test.describe("desktop smoke", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("every sidebar route renders without console errors", async ({ page }) => {
    const { errors } = collectErrors(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    for (const tab of ["Overview", "Modules", "SLD", "Energy", "Compute", "AI Analyst"]) {
      await page.locator(`[aria-label="${tab}"]`).first().click();
      await page.waitForTimeout(300);
    }

    const meaningful = errors.filter((err) => !IGNORE_PATTERN.test(err));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });
});
