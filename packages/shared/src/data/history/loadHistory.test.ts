import { loadHistory } from "./loadHistory";
import type { HttpResponse } from "./measurementsApi";
import type { TopologyViewType } from "../topology/topology.schema";

const device = (id: string, template: string): TopologyViewType["devices"][string] => ({
  device_id: id, template, parent: null, display_name: null, extra_measurements: null,
});

const VIEW: Pick<TopologyViewType, "devices"> = {
  devices: {
    meter_01: device("meter_01", "poi_meter"),
    bess_module_01: device("bess_module_01", "bess_module"),
    bess_module_02: device("bess_module_02", "bess_module"),
    compute_module_01: device("compute_module_01", "compute_module"),
  },
};

function fakeFetch(valueFor: Record<string, number>, calls: string[]): (url: string) => Promise<HttpResponse> {
  return async (url) => {
    calls.push(url);
    const deviceId = new URL(url, "http://x").searchParams.get("device_id") ?? "";
    return { ok: true, status: 200, json: async () => ({ points: [{ ts: "2026-10-02T10:00:00Z", value: valueFor[deviceId] }] }) };
  };
}

describe("loadHistory", () => {
  it("resolves devices by template, sums BESS modules, and queries 10 s buckets", async () => {
    // Arrange
    const calls: string[] = [];
    const fetchFn = fakeFetch({ meter_01: 20, bess_module_01: 600_000, bess_module_02: 520_000, compute_module_01: 1_029_000 }, calls);

    // Act
    const history = await loadHistory(VIEW, "", fetchFn, Date.parse("2026-10-02T10:15:00Z"));

    // Assert
    const at = Date.parse("2026-10-02T10:00:00Z");
    expect({ ...history, queried: calls.length, bucket: new URL(calls[0] ?? "", "http://x").searchParams.get("bucket_s") }).toEqual({
      ok: true,
      series: { grid: [{ x: at, y: 20 }], bess: [{ x: at, y: 1_120_000 }], compute: [{ x: at, y: 1_029_000 }] },
      queried: 4,
      bucket: "10",
    });
  });

  it("falls back to empty (ok: false) if any query fails, so the chart runs live-only", async () => {
    // Arrange
    const failing = async (): Promise<HttpResponse> => ({ ok: false, status: 404, json: async () => ({}) });

    // Act
    const history = await loadHistory(VIEW, "", failing, 0);

    // Assert
    expect(history).toEqual({ ok: false, series: { grid: [], bess: [], compute: [] } });
  });
});
