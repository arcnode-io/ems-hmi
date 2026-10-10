/**
 * der-control-api events history reads (`GET /events`). Events are records,
 * not alarms: no ack, no "seen". Contract: /tmp/handoff-frontend-events-history.md.
 */

import { z } from "zod";

// Reason: the server caps at 1000; 200 covers a demo day with room to spare.
const LIMIT = 200;

export const EventType = z.enum([
  "DER_EVENT_RECEIVED",
  "DER_EVENT_UPDATED",
  "DER_EVENT_STATE",
  "DER_EVENT_APPROVED",
  "DER_EVENT_REJECTED",
  "OPERATOR_RESERVE_SET",
  "DISPATCH_MODE_SET",
]);

/** One row of the log; fields that don't apply to a type are null. */
export const EventRow = z.object({
  id: z.number(),
  occurredAt: z.string(),
  type: EventType,
  /** DER event mRID, or "operator_reserve" / "dispatch_mode". */
  subject: z.string().nullable(),
  /** Utility client LFDI on RECEIVED, "operator" on operator rows. */
  actor: z.string().nullable(),
  program: z.string().nullable(),
  /** The utility's own status for the DER event (e.g. ACTIVE, CANCELLED). */
  status: z.string().nullable(),
  /** Site's resolved posture on DER_EVENT_STATE: IDLE/PENDING/ARMED/ACTIVE/REJECTED. */
  state: z.string().nullable(),
  /** Reserve in Wh on OPERATOR_RESERVE_SET. */
  value: z.number().nullable(),
  /** AUTO | MANUAL on DISPATCH_MODE_SET. */
  detail: z.string().nullable(),
});

export type EventRow = z.infer<typeof EventRow>;

export interface EventsQuery {
  /** der-control-api base URI; "/der-control" = same origin behind nginx. */
  baseUri: string;
  /** Session token from device-api login. */
  token: string;
  sinceMs: number;
}

/** The slice of fetch's Response this module reads — injectable for tests. */
export interface EventsResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type EventsFetch = (url: string, init: { headers: Record<string, string> }) => Promise<EventsResponse>;

/** The browser's fetch, looked up per call (stable reference for hook deps). */
export const BROWSER_FETCH: EventsFetch = (url, init) => fetch(url, init);

/**
 * Fetch events since a time, oldest first (server order).
 * @throws Error on non-2xx or a body that doesn't match the contract
 * @example await fetchEvents({ baseUri: "/der-control", token, sinceMs: Date.now() - 86_400_000 }, fetch)
 */
export async function fetchEvents(query: EventsQuery, fetchFn: EventsFetch): Promise<EventRow[]> {
  const params = new URLSearchParams({ since: new Date(query.sinceMs).toISOString(), limit: String(LIMIT) });
  const res = await fetchFn(`${query.baseUri}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${query.token}` },
  });
  if (!res.ok) throw new Error(`der-control /events ${res.status}`);
  return z.array(EventRow).parse(await res.json());
}

const Retention = z.object({ days: z.number() });

/**
 * How many days der-control-api keeps events before its daily purge.
 * @throws Error on non-2xx or a malformed body
 */
export async function fetchRetentionDays(
  query: { baseUri: string; token: string },
  fetchFn: EventsFetch,
): Promise<number> {
  const res = await fetchFn(`${query.baseUri}/events/retention`, { headers: { Authorization: `Bearer ${query.token}` } });
  if (!res.ok) throw new Error(`der-control /events/retention ${res.status}`);
  return Retention.parse(await res.json()).days;
}

// Reason: a page the operator reads, not a dump — 50 rows ≈ a screen and a half.
export const PAGE_SIZE = 50;

export interface EventPageQuery {
  baseUri: string;
  token: string;
  /** Server-side filters from eventFilter.filterParams. */
  filters: Record<string, string>;
  /** Id of the last loaded row; null = the newest page. */
  before: number | null;
}

/**
 * One page of the log, NEWEST first: `order=desc` for the first page, then
 * `before=<last id>` (ids are monotonic, so pages don't shift as rows land).
 * An empty page = the start of the log for these filters.
 * @throws Error on non-2xx or a body that doesn't match the contract
 */
export async function fetchEventPage(query: EventPageQuery, fetchFn: EventsFetch): Promise<EventRow[]> {
  const params = new URLSearchParams({
    ...query.filters,
    limit: String(PAGE_SIZE),
    ...(query.before === null ? { order: "desc" } : { before: String(query.before) }),
  });
  const res = await fetchFn(`${query.baseUri}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${query.token}` },
  });
  if (!res.ok) throw new Error(`der-control /events ${res.status}`);
  return z.array(EventRow).parse(await res.json());
}
