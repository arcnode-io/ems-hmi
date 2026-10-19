/**
 * Integration — the alarms list. Plays a PDU reporting an input voltage under
 * its template's alarm limit (as the gateway, on the real broker), then follows
 * the alarm from the bell to the list to the device.
 */

import { connectAsync } from "mqtt";
import { test, expect } from "./fixtures/test";
import { GATEWAY } from "./fixtures/stack";

const SITE = "beta_site";
const LOW_VOLTAGE = `sites/${SITE}/devices/pdu_1/measurements/input_voltage_l1/volts`;

test.describe("alarms", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the bell opens the alarms list, and an alarm row opens its device", async ({ page }) => {
    // Arrange
    const gateway = await connectAsync(process.env.INTEGRATION_BROKER_URL!, { ...GATEWAY, clientId: "e2e-alarms-pdu" });
    await page.goto("/");
    await page.getByRole("button", { name: /^Alarms, \d+ active$/ }).click();
    await expect(page).toHaveURL(/\/alarms$/);

    // Act — 240 V is under the PDU's 381 V alarm limit
    await gateway.publishAsync(LOW_VOLTAGE, JSON.stringify({ ts: new Date().toISOString(), value: 240 }));
    const row = page.getByRole("link", { name: /^C1-PDU-A1 · / });
    await expect(row).toContainText("below 381 volts", { timeout: 8000 });
    await row.click();

    // Assert
    await expect(page).toHaveURL(/\/devices\/pdu_1$/);
    await gateway.endAsync();
  });

  test("the SITE cell opens the alarms list", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    await page.getByRole("link", { name: /^SITE / }).click();

    // Assert
    await expect(page).toHaveURL(/\/alarms$/);
    await expect(page.locator('[data-comp="AlarmList"]')).toBeVisible();
  });
});
