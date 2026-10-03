/**
 * Analyst-server history reads (`GET /analyst/measurements`) — the HMI's
 * only path to the timeseries store (system README: ems_hmi → analyst_api).
 * Contract: /tmp/handoff-ai-engineer-measurements-history.md.
 */

import { z } from "zod";
import type { TimePoint } from "./powerBalance";

const MeasurementSeries = z.object({
  points: z.array(
    z.object({
      ts: z.string(),
      // Reason: enum/bool measurements come back as string/bool; a power
      // chart only plots numbers, the rest read as gaps.
      value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
    }),
  ),
});

export interface SeriesQuery {
  /** Analyst base URI; "" = same origin (nginx proxies /analyst/). */
  baseUri: string;
  deviceId: string;
  measurement: string;
  startMs: number;
  endMs: number;
  bucketS: number;
}

/** The slice of fetch's Response this module reads — injectable for tests. */
export interface HttpResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type FetchFn = (url: string) => Promise<HttpResponse>;

/**
 * Fetch one bucketed series. Throws on non-2xx so callers can fall back to
 * live-only (analyst is optional on an appliance).
 * @example await fetchSeries({ baseUri: "", deviceId: "meter_01", measurement: "active_power", startMs, endMs, bucketS: 10 }, fetch)
 */
export async function fetchSeries(query: SeriesQuery, fetchFn: FetchFn): Promise<TimePoint[]> {
  const params = new URLSearchParams({
    device_id: query.deviceId,
    measurement: query.measurement,
    start: new Date(query.startMs).toISOString(),
    end: new Date(query.endMs).toISOString(),
    aggregation: "mean",
    bucket_s: String(query.bucketS),
  });
  const res = await fetchFn(`${query.baseUri}/analyst/measurements?${params.toString()}`);
  if (!res.ok) throw new Error(`analyst /measurements ${res.status}`);
  const body = MeasurementSeries.parse(await res.json());
  return body.points.map((point) => ({
    x: Date.parse(point.ts),
    y: typeof point.value === "number" ? point.value : null,
  }));
}
