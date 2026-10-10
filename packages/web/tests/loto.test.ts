/**
 * E2E — lockout/tagout on a BESS module, against the mock build's in-browser
 * LOTO API (mockLotoFetch, same contract as device-api). The viewer case
 * (list, no buttons) is a jest test — mock builds have no login, so no viewer.
 */

import { test, expect, type Page } from "@playwright/test";

const DEVICE = "/devices/bess_module_01";

async function addLock(page: Page, holder: string, permit = ""): Promise<void> {
  await page.getByTestId("loto-holder").fill(holder);
  if (permit !== "") await page.getByTestId("loto-permit").fill(permit);
  await page.getByRole("button", { name: "Add my lock" }).click();
}

test.describe("LOTO", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("an operator's lock padlocks the module and disables its controls", async ({ page }) => {
    // Arrange
    await page.goto(DEVICE);
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });

    // Act
    await addLock(page, "J. Narvaez", "WO-4471");

    // Assert — header chip, no way to unlock, controls stay disabled.
    await expect(page.locator('[data-comp="LotoChip"]').first()).toBeVisible();
    await expect(panel.locator('[data-region="unlock-unavailable"]')).toBeVisible();
    await expect(panel.getByRole("button", { name: "Unlock controls" })).toHaveCount(0);
    await expect(panel.getByTestId("autopilot-toggle")).toBeDisabled();
    await expect(page.locator('[data-comp="LotoHistoryRow"]')).toHaveCount(1);

    // Act — the Modules list shows the same state on the card.
    await page.locator('[aria-label="Modules"]').first().click();

    // Assert
    const card = page.locator('[data-comp="ModuleCard"]', { hasText: "BESS" }).filter({ has: page.locator('[data-comp="LotoChip"]') });
    await expect(card).toHaveCount(1);
  });

  test("clearing the first of two locks leaves the module locked", async ({ page }) => {
    // Arrange
    await page.goto(DEVICE);
    await expect(page.locator('[data-comp="LotoPanel"]')).toBeAttached({ timeout: 8000 });
    await addLock(page, "Ann");
    await expect(page.getByTestId("loto-active-holder")).toHaveText(["Ann"]);
    await addLock(page, "Bo");
    await expect(page.getByTestId("loto-active-holder")).toHaveText(["Ann", "Bo"]);

    // Act
    await page.getByRole("button", { name: "Clear Ann's lock" }).click();
    await page.getByRole("button", { name: "Confirm clear" }).click();

    // Assert
    await expect(page.getByTestId("loto-active-holder")).toHaveText(["Bo"]);
    await expect(page.locator('[data-comp="LotoChip"]').first()).toBeVisible();
    await expect(page.locator('[data-region="unlock-unavailable"]')).toBeVisible();
  });

  test("clearing the last lock gives the controls back behind Unlock", async ({ page }) => {
    // Arrange
    await page.goto(DEVICE);
    await expect(page.locator('[data-comp="LotoPanel"]')).toBeAttached({ timeout: 8000 });
    await addLock(page, "Ann");
    await expect(page.locator('[data-region="unlock-unavailable"]')).toBeVisible();

    // Act
    await page.getByRole("button", { name: "Clear Ann's lock" }).click();
    await page.getByRole("button", { name: "Confirm clear" }).click();

    // Assert
    await expect(page.locator('[data-comp="LotoChip"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unlock controls" })).toBeVisible();
    await expect(page.locator('[data-comp="LotoHistoryRow"]')).toHaveCount(1);
  });
});
