import { by, device, element, expect } from "detox";

describe("Chat", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("displays chat input and send button", async () => {
    // Navigate to Chat screen via drawer
    await expect(element(by.text("Dashboard"))).toBeVisible();
    await element(by.id("menu-button")).tap();
    await element(by.text("AI Chat")).tap();

    await expect(element(by.id("chat-input"))).toBeVisible();
    await expect(element(by.id("chat-send-button"))).toBeVisible();
  });
});
