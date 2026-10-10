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
