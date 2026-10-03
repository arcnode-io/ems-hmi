import { fetchSeries, type HttpResponse } from "./measurementsApi";

function jsonResponse(body: unknown, status = 200): HttpResponse {
  return { ok: status < 300, status, json: async () => body };
}

describe("fetchSeries", () => {
  it("queries /analyst/measurements with a bucket and maps points to chart x/y", async () => {
    // Arrange
    const calls: string[] = [];
    const fakeFetch = async (url: string): Promise<HttpResponse> => {
      calls.push(url);
      return jsonResponse(
        {
          site_id: "s1", device_id: "meter_01", measurement: "active_power", unit: "watts",
          points: [{ ts: "2026-10-02T10:00:00Z", value: 1_120_000 }, { ts: "2026-10-02T10:00:10Z", value: null }],
        },
      );
    };

    // Act
    const points = await fetchSeries(
      { baseUri: "", deviceId: "meter_01", measurement: "active_power", startMs: Date.parse("2026-10-02T10:00:00Z"), endMs: Date.parse("2026-10-02T10:15:00Z"), bucketS: 10 },
      fakeFetch,
    );

    // Assert
    expect({ url: calls[0], points }).toEqual({
      url: "/analyst/measurements?device_id=meter_01&measurement=active_power&start=2026-10-02T10%3A00%3A00.000Z&end=2026-10-02T10%3A15%3A00.000Z&aggregation=mean&bucket_s=10",
      points: [{ x: Date.parse("2026-10-02T10:00:00Z"), y: 1_120_000 }, { x: Date.parse("2026-10-02T10:00:10Z"), y: null }],
    });
  });

  it("throws on a non-2xx so the caller can fall back to live-only", async () => {
    // Arrange
    const notFound = async (): Promise<HttpResponse> => jsonResponse("nope", 404);

    // Act / Assert
    await expect(
      fetchSeries({ baseUri: "", deviceId: "d", measurement: "m", startMs: 0, endMs: 1, bucketS: 10 }, notFound),
    ).rejects.toThrow("404");
  });
});
