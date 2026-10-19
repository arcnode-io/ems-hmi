/**
 * Playwright `test` for every spec: the analyst server isn't in the e2e stack
 * (it needs LLM credentials), so its reads answer at the network: an empty
 * history series (live-only, as on a site with no history yet) and no price
 * forecast (a site not enrolled in a market).
 */

import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/api/analyst/measurements*", (route) => route.fulfill({ json: { points: [] } }));
    await page.route("**/api/analyst/forecast*", (route) =>
      route.fulfill({ json: { settlement_point: null, unit: "", points: [] } }),
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
