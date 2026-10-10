/**
 * E2E — the mocked BESS dispatch workflow. An operator at the desk console
 * opens a BESS device, applies the autopilot's proposed setpoint, confirms
 * through the two-step ConfirmationModal, and watches the lifecycle advance.
 *
 * Covers DeviceDetail (CommandPanel) end-to-end; the lifecycle simulation
 * and the SLD/Energy feedback are unit-tested in shared/.
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

// Ignores benign deprecation noise, expected static-fixture 404s, and
// sandbox network flakes (ERR_NETWORK_CHANGED) — none are app defects.
const IGNORE_PATTERN =
  /shadow.*deprecated|HTTP 404 fetching .*sld(-portrait)?\.svg|Failed to load resource: net::ERR/i;

test.describe("BESS dispatch workflow", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("operator confirms a dispatch through the two-step modal", async ({ page }) => {
    const errors = collectErrors(page);

    // Arrange — open a dispatchable BESS module at the desk console.
    await page.goto("/devices/bess_module_01");
    await page.waitForLoadState("networkidle");

    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await expect(page.getByText("Dispatch Control")).toBeAttached();
    // Autopilot's standing proposal is shown.
    await expect(page.getByText(/Discharge 1620 kW/).first()).toBeAttached();

    // Act — unlock, then Apply opens the ConfirmationModal (never dispatches on first click).
    await panel.getByRole("button", { name: "Unlock controls" }).click();
    await page.locator('[data-action="apply"]').first().click();
    await expect(page.locator('[data-comp="ConfirmationModal"]')).toBeAttached();
    // Demo runs in sim mode → the SIMULATED band is the SIM affordance.
    await expect(page.locator('[data-region="sim-band"]')).toBeAttached();

    // Act — confirm; the lifecycle advances past the ack delay to executing.
    await page.locator('[data-action="confirm"]').click();
    await expect(page.locator('[data-comp="DispatchStatusCard"]')).toBeAttached({
      timeout: 5000,
    });

    // Assert — the dispatch reaches the executing phase.
    await expect(page.getByText(/Executing/).first()).toBeAttached({ timeout: 6000 });

    const meaningful = errors.filter((err) => !IGNORE_PATTERN.test(err));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });

  test("command controls stay locked until the operator unlocks them", async ({ page }) => {
    // Arrange
    await page.goto("/devices/bess_module_01");
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });

    // Act — nothing; a fresh panel is locked.

    // Assert
    await expect(panel.locator('[data-action="apply"]')).toBeDisabled();
    await expect(panel.getByTestId("autopilot-toggle")).toBeDisabled();
    await expect(panel.getByRole("button", { name: "Unlock controls" })).toBeEnabled();
  });

  test("unlocked controls relock 60 s after the last write", async ({ page }) => {
    // Arrange — fake clock so the 60 s idle runs instantly.
    await page.clock.install();
    await page.goto("/devices/bess_module_01");
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await panel.getByRole("button", { name: "Unlock controls" }).click();
    await panel.getByTestId("autopilot-toggle").click();
    await expect(panel.getByTestId("autopilot-toggle")).toHaveAttribute("data-on", "true");

    // Act — 59 s after the write it's still open; one more second relocks.
    await page.clock.fastForward(59_000);
    const stillOpen = await panel.getByTestId("autopilot-toggle").isEnabled();
    await page.clock.fastForward(1_000);

    // Assert
    expect(stillOpen).toBe(true);
    await expect(panel.getByTestId("autopilot-toggle")).toBeDisabled();
    await expect(panel.getByRole("button", { name: "Unlock controls" })).toBeVisible();
  });

  test("navigating away relocks the controls", async ({ page }) => {
    // Arrange
    await page.goto("/devices/bess_module_01");
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await panel.getByRole("button", { name: "Unlock controls" }).click();
    await expect(panel.getByTestId("autopilot-toggle")).toBeEnabled();

    // Act — leave for another screen in-app, then browser-back to the module.
    await page.locator('[aria-label="Modules"]').first().click();
    await expect(page).toHaveURL(/\/modules/);
    await page.goBack();

    // Assert
    await expect(page.locator('[data-comp="CommandPanel"]').getByTestId("autopilot-toggle")).toBeDisabled();
  });
});
