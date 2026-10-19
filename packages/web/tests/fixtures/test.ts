/**
 * Playwright `test` for every spec: the analyst server isn't in the e2e stack
 * (it needs LLM credentials), so its history read answers an empty series at
 * the network — the HMI then shows live-only, as on a site with no history yet.
 */

import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/api/analyst/measurements*", (route) => route.fulfill({ json: { points: [] } }));
    await use(page);
  },
});

export { expect } from "@playwright/test";
