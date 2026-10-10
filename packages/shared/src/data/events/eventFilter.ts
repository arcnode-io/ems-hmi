/**
 * Event history filters → `GET /events` query params. Filtering is server-side
 * so it searches the whole retained log, not just the loaded page.
 */

import { match } from "ts-pattern";
import { EventType } from "./eventsApi";

export interface EventFilter {
  kind: "all" | "curtailment" | "reserve" | "dispatch";
  /** Narrows DER rows only; ignored unless kind is curtailment. */
  program: "all" | "DLR_LINE_CONSTRAINT" | "ERCOT_FLEX";
  range: "24h" | "7d" | "30d" | "90d";
}

export const DEFAULT_FILTER: EventFilter = { kind: "all", program: "all", range: "24h" };

const HOUR_MS = 60 * 60 * 1000;
const DER_TYPES = EventType.options.filter((type) => type.startsWith("DER_EVENT_"));

/**
 * @param filter the page's chip selections
 * @param nowMs now, for the range start
 * @returns `since` plus `types` / `program` when narrowed
 * @example filterParams({ kind: "reserve", program: "all", range: "24h" }, now) // { since, types: "OPERATOR_RESERVE_SET" }
 */
export function filterParams(filter: EventFilter, nowMs: number): Record<string, string> {
  const hours = match(filter.range)
    .with("24h", () => 24)
    .with("7d", () => 7 * 24)
    .with("30d", () => 30 * 24)
    .with("90d", () => 90 * 24)
    .exhaustive();
  const since = new Date(nowMs - hours * HOUR_MS).toISOString();
  return match(filter.kind)
    .with("all", () => ({ since }))
    .with("curtailment", () => ({
      since,
      types: DER_TYPES.join(","),
      ...(filter.program === "all" ? {} : { program: filter.program }),
    }))
    .with("reserve", () => ({ since, types: "OPERATOR_RESERVE_SET" }))
    .with("dispatch", () => ({ since, types: "DISPATCH_MODE_SET" }))
    .exhaustive();
}
