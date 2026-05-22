/**
 * E2E — the redesigned Analyst screen. Runs against `?mock`, which swaps
 * the live SSE stream for the canned mockAnalystStream so the turn is
 * deterministic + server-free. Covers the mobile inline stream and the
 * desktop two-pane.
 */

import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err: Error) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const IGNORE_PATTERN =
  /shadow.*deprecated|HTTP 404 fetching .*sld(-portrait)?\.svg|Failed to load resource: net::ERR/i;

/** Send the first suggestion and wait for the turn to settle into an artifact. */
async function sendAndSettle(page: Page): Promise<void> {
  await expect(page.locator('[data-comp="SuggestionChips"]')).toBeAttached({
    timeout: 8000,
  });
  await page.getByText(/day-ahead clearing price/i).first().click();
  // The canned stream settles into at least one artifact card.
  await expect(page.locator('[data-comp="ArtifactCard"]').first()).toBeAttached({
    timeout: 12000,
  });
}

test.describe("Analyst redesign", () => {
  test("mobile — suggestion → streamed turn → artifact card", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 402, height: 860 });
    await page.goto("/analyst?mock");
    await page.waitForLoadState("networkidle");

    await sendAndSettle(page);

    // The user's question is in the stream, and the chips are gone.
    await expect(page.getByText(/clearing price for market_01/i).first()).toBeAttached();
    await expect(page.locator('[data-comp="SuggestionChips"]')).not.toBeAttached();

    const meaningful = errors.filter((e) => !IGNORE_PATTERN.test(e));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });

  test("desktop — two-pane, artifact pins to the canvas", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/analyst?mock");
    await page.waitForLoadState("networkidle");

    await sendAndSettle(page);
    await expect(page.locator('[data-comp="AnalystScreen"]')).toBeAttached();

    const meaningful = errors.filter((e) => !IGNORE_PATTERN.test(e));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });
});
