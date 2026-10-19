/**
 * Analyst-server day-ahead price forecast (`GET /forecast`, reached as
 * /analyst/forecast — the HMI nginx rewrites it). ems-analyst-model writes
 * the next 24 h of `dam_lmp_price` per settlement point; the server answers
 * for the deploy's own hub.
 */

import { z } from "zod";
import type { FetchFn } from "../history/measurementsApi";
import type { TimePoint } from "../history/powerBalance";

const MEASUREMENT = "dam_lmp_price";

const ForecastSeries = z.object({
  settlement_point: z.string().nullable(),
  unit: z.string(),
  points: z.array(z.object({ forecast_for: z.string(), value: z.number() })),
});

export type Forecast =
  | { kind: "not-enrolled" }
  | { kind: "prices"; settlementPoint: string; unit: string; points: TimePoint[] };

export interface ForecastQuery {
  /** Analyst base URI (cfg chatApiUri); "" = same origin. */
  baseUri: string;
  startMs: number;
  endMs: number;
}

/**
 * Fetch the price forecast in [startMs, endMs].
 * @throws Error on non-2xx — analyst is optional on an appliance
 */
export async function fetchForecast(query: ForecastQuery, fetchFn: FetchFn): Promise<Forecast> {
  const params = new URLSearchParams({
    measurement: MEASUREMENT,
    start: new Date(query.startMs).toISOString(),
    end: new Date(query.endMs).toISOString(),
  });
  const res = await fetchFn(`${query.baseUri}/analyst/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`analyst /forecast ${res.status}`);
  const body = ForecastSeries.parse(await res.json());
  // Reason: an empty window answers a sentinel envelope, and a site off the
  // market answers settlement_point null — either way there are no prices.
  if (body.settlement_point === null || body.points.length === 0) return { kind: "not-enrolled" };
  return {
    kind: "prices",
    settlementPoint: body.settlement_point,
    unit: body.unit,
    points: body.points.map((point) => ({ x: Date.parse(point.forecast_for), y: point.value })),
  };
}
