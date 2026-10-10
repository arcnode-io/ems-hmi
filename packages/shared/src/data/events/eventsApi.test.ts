import { fetchEvents, type EventRow, type EventsResponse } from "./eventsApi";

const reply = (status: number, body: unknown): Promise<EventsResponse> =>
  Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) });

const ROW: EventRow = {
  id: 12,
  occurredAt: "2026-10-10T09:23:17.004Z",
  type: "DER_EVENT_STATE",
  subject: "f3a1",
  actor: null,
  program: "DLR_LINE_CONSTRAINT",
  status: "ACTIVE",
  state: "ACTIVE",
  value: null,
  detail: null,
};

describe("fetchEvents", () => {
  it("GETs /events since a time with the session token and returns the parsed rows", async () => {
    // Arrange
    const calls: [string, { headers: Record<string, string> }][] = [];
    const fetchFn = (url: string, init: { headers: Record<string, string> }): Promise<EventsResponse> => {
      calls.push([url, init]);
      return reply(200, [ROW]);
    };

    // Act
    const rows = await fetchEvents(
      { baseUri: "/der-control", token: "tok", sinceMs: Date.parse("2026-10-10T00:00:00Z") },
      fetchFn,
    );

    // Assert
    expect({ rows, calls }).toEqual({
      rows: [ROW],
      calls: [
        [
          "/der-control/events?since=2026-10-10T00%3A00%3A00.000Z&limit=200",
          { headers: { Authorization: "Bearer tok" } },
        ],
      ],
    });
  });

  it("throws on a non-2xx so the card can say it couldn't load", async () => {
    // Arrange
    const fetchFn = (): Promise<EventsResponse> => reply(401, null);

    // Act / Assert
    await expect(fetchEvents({ baseUri: "", token: "bad", sinceMs: 0 }, fetchFn)).rejects.toThrow(/401/);
  });
});
