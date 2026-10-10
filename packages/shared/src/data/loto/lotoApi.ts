/**
 * device-api LOTO client. Contract: /tmp/handoff-loto-contract.md (FINAL,
 * 2026-10-10). LOTO is a state, not an alarm — set/clear are events, never
 * acknowledged. Reads are open; writes need the operator's bearer token.
 */

import { z } from "zod";
import { match } from "ts-pattern";

/** One lock row. Active ⇔ cleared_at === null. Every row is history. */
export const Lock = z.object({
  id: z.number(),
  device_id: z.string(),
  holder_name: z.string(),
  permit_ref: z.string().nullable(),
  /** ISO-8601 UTC. */
  set_at: z.string(),
  set_by_role: z.string(),
  cleared_at: z.string().nullable(),
  cleared_by_role: z.string().nullable(),
});
export type Lock = z.infer<typeof Lock>;

/** GET /loto: active locks (oldest first) + every locked device incl. DTM subtrees. */
export const LotoSnapshot = z.object({
  locks: z.array(Lock),
  locked_devices: z.array(z.string()),
});
export type LotoSnapshot = z.infer<typeof LotoSnapshot>;

export interface LockRequest {
  holder_name: string;
  permit_ref: string | null;
}

export interface LotoInit {
  method?: "POST" | "DELETE";
  headers: Record<string, string>;
  body?: string;
}

/** The slice of fetch this module uses — injectable for tests and mock builds. */
export type LotoFetch = (
  url: string,
  init: LotoInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/** The browser's fetch, looked up per call (stable reference for hook deps). */
export const BROWSER_LOTO_FETCH: LotoFetch = (url, init) => fetch(url, init);

/** Where writes go and who's writing. */
export interface LotoWriter {
  baseUri: string;
  token: string;
}

const NestError = z.object({ message: z.union([z.string(), z.array(z.string())]) });

/** A failed LOTO call, with a message fit to show the operator. */
export class LotoError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LotoError";
  }
}

async function serverMessage(res: { json: () => Promise<unknown> }): Promise<string | null> {
  const parsed = NestError.safeParse(await res.json().catch(() => null));
  if (!parsed.success) return null;
  const { message } = parsed.data;
  return typeof message === "string" ? message : message.join("; ");
}

async function failure(res: { status: number; json: () => Promise<unknown> }, holder: string | null): Promise<LotoError> {
  const fromServer = await serverMessage(res);
  const text = match(res.status)
    .with(401, () => "Your session expired. Sign in again.")
    .with(403, () => "Only operators can set or clear locks.")
    .with(404, () => fromServer ?? "Not found.")
    .with(409, () => (holder !== null ? `${holder} already holds a lock on this device.` : "That lock is already cleared."))
    .otherwise(() => fromServer ?? `device-api answered ${res.status}.`);
  return new LotoError(res.status, text);
}

/**
 * Active locks + the expanded locked-device set.
 * @throws LotoError on non-2xx; ZodError on a body off-contract
 */
export async function fetchLoto(baseUri: string, fetchFn: LotoFetch): Promise<LotoSnapshot> {
  const res = await fetchFn(`${baseUri}/loto`, { headers: {} });
  if (!res.ok) throw await failure(res, null);
  return LotoSnapshot.parse(await res.json());
}

/**
 * Every lock row ever set on a device, newest first.
 * @throws LotoError on non-2xx; ZodError on a body off-contract
 */
export async function fetchLotoHistory(baseUri: string, deviceId: string, fetchFn: LotoFetch): Promise<Lock[]> {
  const params = new URLSearchParams({ device_id: deviceId });
  const res = await fetchFn(`${baseUri}/loto/history?${params.toString()}`, { headers: {} });
  if (!res.ok) throw await failure(res, null);
  return z.array(Lock).parse(await res.json());
}

/**
 * Put one person's lock on a device (group lockout — others' locks are untouched).
 * @throws LotoError — 409 when this holder already has a lock here
 */
export async function setLock(writer: LotoWriter, deviceId: string, req: LockRequest, fetchFn: LotoFetch): Promise<Lock> {
  const res = await fetchFn(`${writer.baseUri}/devices/${encodeURIComponent(deviceId)}/loto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${writer.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw await failure(res, req.holder_name.trim());
  return Lock.parse(await res.json());
}

/**
 * Clear exactly one lock row. The device stays locked while any other is active.
 * @throws LotoError — 409 when already cleared
 */
export async function clearLock(writer: LotoWriter, lockId: number, fetchFn: LotoFetch): Promise<Lock> {
  const res = await fetchFn(`${writer.baseUri}/loto/${lockId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${writer.token}` },
  });
  if (!res.ok) throw await failure(res, null);
  return Lock.parse(await res.json());
}
