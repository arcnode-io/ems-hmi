import { filterParams, type EventFilter } from "./eventFilter";

const NOW = Date.parse("2026-10-10T20:00:00Z");

describe("filterParams", () => {
  it("turns the page's chips into server-side query params", () => {
    // Arrange
    const filters: EventFilter[] = [
      { kind: "all", program: "all", range: "24h" },
      { kind: "curtailment", program: "ERCOT_FLEX", range: "7d" },
      { kind: "reserve", program: "all", range: "90d" },
      { kind: "dispatch", program: "all", range: "30d" },
    ];

    // Act
    const params = filters.map((f) => filterParams(f, NOW));

    // Assert — program only narrows DER rows, so it rides with the curtailment kind
    expect(params).toEqual([
      { since: "2026-10-09T20:00:00.000Z" },
      {
        since: "2026-10-03T20:00:00.000Z",
        types: "DER_EVENT_RECEIVED,DER_EVENT_UPDATED,DER_EVENT_STATE,DER_EVENT_APPROVED,DER_EVENT_REJECTED",
        program: "ERCOT_FLEX",
      },
      { since: "2026-07-12T20:00:00.000Z", types: "OPERATOR_RESERVE_SET" },
      { since: "2026-09-10T20:00:00.000Z", types: "DISPATCH_MODE_SET" },
    ]);
  });
});
