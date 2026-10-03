/**
 * Seed the power-balance window from analyst-server history. Device ids
 * come from the topology by template, never hardcoded (the DTM can be
 * regenerated with new ids).
 */

import type { TopologyViewType } from "../topology/topology.schema";
import { fetchSeries, type FetchFn } from "./measurementsApi";
import { EMPTY_BALANCE, sumSeries, WINDOW_MS, type BalanceSeries, type TimePoint } from "./powerBalance";

// Reason: 10 s buckets → 90 points over 15 min; live samples take over after.
const BUCKET_S = 10;

function idsOf(view: Pick<TopologyViewType, "devices">, template: string): string[] {
  return Object.values(view.devices)
    .filter((dev) => dev.template === template)
    .map((dev) => dev.device_id);
}

/**
 * All-or-nothing: any failed query → `ok: false` + empty series, so the chart
 * runs live-only instead of mixing partial history.
 */
export async function loadHistory(
  view: Pick<TopologyViewType, "devices">,
  baseUri: string,
  fetchFn: FetchFn,
  nowMs: number,
): Promise<{ ok: boolean; series: BalanceSeries }> {
  const query = (deviceId: string, measurement: string): Promise<TimePoint[]> =>
    fetchSeries(
      { baseUri, deviceId, measurement, startMs: nowMs - WINDOW_MS, endMs: nowMs, bucketS: BUCKET_S },
      fetchFn,
    );
  const summed = async (template: string, measurement: string): Promise<TimePoint[]> =>
    sumSeries(await Promise.all(idsOf(view, template).map((id) => query(id, measurement))));
  try {
    const [grid, bess, gpu] = await Promise.all([
      summed("poi_meter", "active_power"),
      summed("bess_module", "active_power"),
      summed("compute_module", "total_power"),
    ]);
    return { ok: true, series: { grid, bess, gpu } };
  } catch {
    return { ok: false, series: EMPTY_BALANCE };
  }
}
