/**
 * E2E — the BESS dispatch workflow. An operator at the desk console opens a
 * BESS device, sets a setpoint within its rated range, confirms through the
 * two-step ConfirmationModal, and the command goes out over MQTT — the demo's
 * mock gateway acks it on the same contract a real gateway uses.
 */

import { test, expect, type Page, type ConsoleMessage, type Locator } from "@playwright/test";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err: Error) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

// Ignores benign deprecation noise, expected static-fixture 404s, and
// sandbox network flakes (ERR_NETWORK_CHANGED) — none are app defects.
const IGNORE_PATTERN =
  /shadow.*deprecated|HTTP 404 fetching .*sld(-portrait)?\.svg|Failed to load resource: net::ERR/i;

const DEVICE = "/devices/bess_module_01";

/** The stepper's "+" — stands in for any write control in the lock tests. */
const plus = (panel: Locator): Locator => panel.locator('[data-comp="SetpointStepper"]').getByRole("button", { name: "+" });

test.describe("BESS dispatch workflow", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("operator confirms a dispatch through the two-step modal", async ({ page }) => {
    const errors = collectErrors(page);

    // Arrange — open a dispatchable BESS module at the desk console.
    await page.goto(DEVICE);
    await page.waitForLoadState("networkidle");

    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await expect(page.getByText("Dispatch Control")).toBeAttached();
    // Act — unlock, step to Discharge 200 kW, then Apply opens the ConfirmationModal (never dispatches on first click).
    await panel.getByRole("button", { name: "Unlock controls" }).click();
    await plus(panel).click();
    await plus(panel).click();
    await expect(panel.getByText("Discharge 200 kW").first()).toBeAttached();
    await page.locator('[data-action="apply"]').first().click();
    await expect(page.locator('[data-comp="ConfirmationModal"]')).toBeAttached();
    // Demo runs in sim mode → the SIMULATED band is the SIM affordance.
    await expect(page.locator('[data-region="sim-band"]')).toBeAttached();

    // Act — confirm; the gateway acks received, then done.
    await page.locator('[data-action="confirm"]').click();

    // Assert — the BESS accepts the setpoint.
    await expect(page.getByText(/Discharge 200 kW · accepted by the BESS/).first()).toBeAttached({ timeout: 6000 });

    const meaningful = errors.filter((err) => !IGNORE_PATTERN.test(err));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });

  test("command controls stay locked until the operator unlocks them", async ({ page }) => {
    // Arrange
    await page.goto(DEVICE);
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });

    // Act — nothing; a fresh panel is locked.

    // Assert
    await expect(panel.locator('[data-action="apply"]')).toBeDisabled();
    await expect(plus(panel)).toBeDisabled();
    await expect(panel.getByRole("button", { name: "Unlock controls" })).toBeEnabled();
  });

  test("unlocked controls relock 60 s after unlocking", async ({ page }) => {
    // Arrange — fake clock so the 60 s idle runs instantly.
    await page.clock.install();
    await page.goto(DEVICE);
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await panel.getByRole("button", { name: "Unlock controls" }).click();

    // Act — 59 s after unlocking it's still open; one more second relocks.
    await page.clock.fastForward(59_000);
    const stillOpen = await plus(panel).isEnabled();
    await page.clock.fastForward(1_000);

    // Assert
    expect(stillOpen).toBe(true);
    await expect(plus(panel)).toBeDisabled();
    await expect(panel.getByRole("button", { name: "Unlock controls" })).toBeVisible();
  });

  test("navigating away relocks the controls", async ({ page }) => {
    // Arrange
    await page.goto(DEVICE);
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await panel.getByRole("button", { name: "Unlock controls" }).click();
    await expect(plus(panel)).toBeEnabled();

    // Act — leave for another screen in-app, then browser-back to the module.
    await page.locator('[aria-label="Modules"]').first().click();
    await expect(page).toHaveURL(/\/modules/);
    await page.goBack();

    // Assert
    await expect(plus(page.locator('[data-comp="CommandPanel"]'))).toBeDisabled();
  });
});
