/** Tests for the intel-feed derivation. AAA pattern. */

import { deriveIntelFeed } from "./intelFeed";
import type { ConversationItem } from "./conversation.types";

const TS = "2026-05-22T14:00:00Z";

function msg(id: string, trace: { tool: string; summary?: string | null }[]): ConversationItem {
  return {
    kind: "message",
    id,
    role: "assistant",
    text: "",
    timestamp: TS,
    trace: trace.map((t) => ({
      tool: t.tool,
      args: {},
      outcome: "ok" as const,
      ms: 10,
      summary: t.summary ?? null,
    })),
  };
}

describe("deriveIntelFeed", () => {
  it("extracts a headline per external tool from tool traces", () => {
    // Arrange
    const items = [
      msg("m1", [
        { tool: "get_market_data", summary: "ERCOT LMP $312 — scarcity pricing" },
        { tool: "query_timeseries", summary: null },
      ]),
      msg("m2", [{ tool: "get_energy_news", summary: "EIA: gas storage draw widens" }]),
    ];

    // Act
    const feed = deriveIntelFeed(items);

    // Assert
    expect(feed).toHaveLength(2);
    expect(feed.find((h) => h.source === "market")?.headline).toBe(
      "ERCOT LMP $312 — scarcity pricing",
    );
    expect(feed.find((h) => h.source === "news")?.label).toBe("Energy News");
  });

  it("keeps only the latest headline per source", () => {
    // Arrange
    const items = [
      msg("m1", [{ tool: "get_market_data", summary: "old LMP" }]),
      msg("m2", [{ tool: "get_market_data", summary: "new LMP" }]),
    ];

    // Act
    const feed = deriveIntelFeed(items);

    // Assert
    expect(feed).toHaveLength(1);
    expect(feed[0].headline).toBe("new LMP");
  });

  it("ignores internal tools and calls with no summary", () => {
    // Arrange
    const items = [
      msg("m1", [
        { tool: "query_timeseries", summary: "should be ignored" },
        { tool: "get_energy_news", summary: null },
      ]),
    ];

    // Act + Assert
    expect(deriveIntelFeed(items)).toEqual([]);
  });
});
