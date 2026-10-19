import { fetchForecast } from "./forecastApi";
import type { HttpResponse } from "../history/measurementsApi";

const START_MS = Date.parse("2026-10-19T00:00:00Z");
const END_MS = Date.parse("2026-10-20T00:00:00Z");

function respond(body: unknown, status = 200): { calls: string[]; fetchFn: (url: string) => Promise<HttpResponse> } {
  const calls: string[] = [];
  return {
    calls,
    fetchFn: async (url) => {
      calls.push(url);
      return { ok: status < 300, status, json: async () => body };
    },
  };
}

const ENROLLED = {
  site_id: "beta_site",
  settlement_point: "HB_NORTH",
  measurement: "dam_lmp_price",
  unit: "usd_per_mwh",
  model_name: "ridge",
  model_version: 3,
  points: [
    { forecast_for: "2026-10-19T01:00:00Z", value: 31.5 },
    { forecast_for: "2026-10-19T02:00:00Z", value: 28.25 },
  ],
};

describe("fetchForecast", () => {
  it("reads the day-ahead price forecast for the window and returns the hub, unit and points", async () => {
    // Arrange
    const { calls, fetchFn } = respond(ENROLLED);

    // Act
    const actual = await fetchForecast({ baseUri: "/api", startMs: START_MS, endMs: END_MS }, fetchFn);

    // Assert
    expect(actual).toEqual({
      kind: "prices",
      settlementPoint: "HB_NORTH",
      unit: "usd_per_mwh",
      points: [
        { x: Date.parse("2026-10-19T01:00:00Z"), y: 31.5 },
        { x: Date.parse("2026-10-19T02:00:00Z"), y: 28.25 },
      ],
    });
    expect(calls).toEqual([
      "/api/analyst/forecast?measurement=dam_lmp_price&start=2026-10-19T00%3A00%3A00.000Z&end=2026-10-20T00%3A00%3A00.000Z",
    ]);
  });

  it("reads no points as not enrolled", async () => {
    // Arrange
    const { fetchFn } = respond({ ...ENROLLED, unit: "", model_name: "", model_version: 0, points: [] });

    // Act
    const actual = await fetchForecast({ baseUri: "", startMs: START_MS, endMs: END_MS }, fetchFn);

    // Assert
    expect(actual).toEqual({ kind: "not-enrolled" });
  });

  it("reads a null settlement point as not enrolled", async () => {
    // Arrange
    const { fetchFn } = respond({ ...ENROLLED, settlement_point: null, points: [] });

    // Act
    const actual = await fetchForecast({ baseUri: "", startMs: START_MS, endMs: END_MS }, fetchFn);

    // Assert
    expect(actual).toEqual({ kind: "not-enrolled" });
  });

  it("throws on a non-2xx so the screen can say prices are unavailable", async () => {
    // Arrange
    const { fetchFn } = respond({}, 502);

    // Act / Assert
    await expect(fetchForecast({ baseUri: "", startMs: START_MS, endMs: END_MS }, fetchFn)).rejects.toThrow("502");
  });
});
