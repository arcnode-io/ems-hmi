/**
 * Integration — the Analyst screen. The analyst server is stubbed at the network
 * (`POST …/analyst/chat` answered with a fixed SSE turn), so the app runs its
 * real stream client — nothing canned ships in the bundle. Covers the mobile
 * inline stream and the desktop two-pane.
 */

import { type Page, type ConsoleMessage } from "@playwright/test";
import { test, expect } from "./fixtures/test";

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

const ALARM_TABLE = {
  title: "Active alarms",
  columns: [
    { key: "device", label: "Device", align: "left" },
    { key: "value", label: "Value", align: "right" },
  ],
  rows: [{ device: "G1-RLY-1", value: "13.9 kV" }],
  rowSeverity: ["warn"],
  dataAsOf: "2026-10-17T00:00:00Z",
};

/** One analyst turn on the server's SSE wire: a tool trace, the message, done. */
const SSE_TURN = [
  ["tool_start", { seq: 1, tool: "listDevicesWhere", label: "Listing devices in alarm" }],
  ["tool_end", { seq: 1, tool: "listDevicesWhere", outcome: "ok", ms: 87 }],
  [
    "message",
    {
      role: "assistant",
      timestamp: "2026-10-17T00:00:00Z",
      content: [
        { type: "text", text: "One device is in warning." },
        { type: "artifact", artifact: { kind: "table", spec: ALARM_TABLE } },
      ],
    },
  ],
  ["done", {}],
]
  .map(([event, data]) => `event: ${String(event)}\ndata: ${JSON.stringify(data)}\n\n`)
  .join("");

async function stubAnalyst(page: Page): Promise<void> {
  await page.route("**/analyst/chat", (route) =>
    route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: SSE_TURN }),
  );
}

/** Send the first suggestion and wait for the turn to settle into an artifact. */
async function sendAndSettle(page: Page): Promise<void> {
  await expect(page.locator('[data-comp="SuggestionChips"]')).toBeAttached({
    timeout: 8000,
  });
  await page.getByText(/devices currently in alarm/i).first().click();
  // The stubbed turn settles into its artifact card.
  await expect(page.locator('[data-comp="ArtifactCard"]').first()).toBeAttached({
    timeout: 12000,
  });
}

test.describe("Analyst redesign", () => {
  test("mobile — suggestion → streamed turn → artifact card", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 402, height: 860 });
    await stubAnalyst(page);
    await page.goto("/analyst");
    await page.waitForLoadState("networkidle");

    await sendAndSettle(page);

    // The user's question is in the stream, and the chips are gone.
    await expect(page.getByText(/devices currently in alarm/i).first()).toBeAttached();
    await expect(page.locator('[data-comp="SuggestionChips"]')).not.toBeAttached();

    const meaningful = errors.filter((err) => !IGNORE_PATTERN.test(err));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });

  test("desktop — two-pane, artifact pins to the canvas", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await stubAnalyst(page);
    await page.goto("/analyst");
    await page.waitForLoadState("networkidle");

    await sendAndSettle(page);
    await expect(page.locator('[data-comp="AnalystScreen"]')).toBeAttached();

    const meaningful = errors.filter((err) => !IGNORE_PATTERN.test(err));
    expect(meaningful, `unexpected console errors:\n${meaningful.join("\n")}`).toEqual([]);
  });
});
