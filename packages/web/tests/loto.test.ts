/**
 * Integration — lockout/tagout on a BESS module against the real device-api.
 * Its postgres outlives each test, so every test clears its active locks after
 * itself and counts history from where it started. The viewer case (list, no
 * buttons) is a jest test.
 */

import { readFileSync } from "fs";
import { type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { STORAGE_STATE } from "./global-setup";

const DEVICE = "/devices/bess_module_1";

async function addLock(page: Page, holder: string, permit = ""): Promise<void> {
  await page.getByTestId("loto-holder").fill(holder);
  if (permit !== "") await page.getByTestId("loto-permit").fill(permit);
  await page.getByRole("button", { name: "Add my lock" }).click();
}

/** The operator token global-setup logged in with. */
function operatorToken(): string {
  const state = JSON.parse(readFileSync(STORAGE_STATE, "utf8")) as { origins: Array<{ localStorage: Array<{ value: string }> }> };
  return state.origins[0]!.localStorage[0]!.value;
}

/** Clear every active lock — LOTO state lives in device-api's database. */
async function clearAllLocks(request: APIRequestContext): Promise<void> {
  const snapshot = (await (await request.get("/api/loto")).json()) as { locks: Array<{ id: number }> };
  const auth = { Authorization: `Bearer ${operatorToken()}` };
  for (const lock of snapshot.locks) await request.delete(`/api/loto/${lock.id}`, { headers: auth });
}

const historyRows = (page: Page): Locator => page.locator('[data-comp="LotoHistoryRow"]');

/** History rows once the history has loaded (rows or its empty state). */
async function historyCount(page: Page): Promise<number> {
  await expect(historyRows(page).first().or(page.getByText(/never been locked out/))).toBeAttached();
  return historyRows(page).count();
}

test.describe("LOTO", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.afterEach(async ({ request }) => clearAllLocks(request));

  test("an operator's lock padlocks the module and disables its controls", async ({ page }) => {
    // Arrange
    await page.goto(DEVICE);
    const panel = page.locator('[data-comp="CommandPanel"]');
    await expect(panel).toBeAttached({ timeout: 8000 });
    await expect(page.locator('[data-comp="LotoPanel"]')).toBeAttached();
    const before = await historyCount(page);

    // Act
    await addLock(page, "J. Narvaez", "WO-4471");

    // Assert — header chip, no way to unlock, controls stay disabled.
    await expect(page.locator('[data-comp="LotoChip"]').first()).toBeVisible();
    await expect(panel.locator('[data-region="unlock-unavailable"]')).toBeVisible();
    await expect(panel.getByRole("button", { name: "Unlock controls" })).toHaveCount(0);
    await expect(panel.locator('[data-comp="SetpointStepper"]').getByRole("button", { name: "+" })).toBeDisabled();
    await expect(historyRows(page)).toHaveCount(before + 1);

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
    const before = await historyCount(page);
    await addLock(page, "Ann");
    await expect(page.locator('[data-region="unlock-unavailable"]')).toBeVisible();

    // Act
    await page.getByRole("button", { name: "Clear Ann's lock" }).click();
    await page.getByRole("button", { name: "Confirm clear" }).click();

    // Assert
    await expect(page.locator('[data-comp="LotoChip"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unlock controls" })).toBeVisible();
    await expect(historyRows(page)).toHaveCount(before + 1);
  });
});
