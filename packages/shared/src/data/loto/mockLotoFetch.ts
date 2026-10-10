/**
 * In-browser stand-in for device-api's LOTO routes, injected as the LotoFetch
 * in mock builds (public demo, Playwright). Follows the contract's semantics —
 * group lockout, subtree expansion, 400/404/409 — so the UI behaves the same
 * against it as against the real API. The mock session is always an operator.
 */

import { match, P } from "ts-pattern";
import type { Lock, LotoFetch } from "./lotoApi";

type DeviceParents = Readonly<Record<string, { parent?: string | null }>>;

const MAX_TEXT = 120;
const LOCK_ROUTE = /\/devices\/([^/]+)\/loto$/;
const CLEAR_ROUTE = /\/loto\/(\d+)$/;

function reply(status: number, body: unknown): ReturnType<LotoFetch> {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
}

function problem(status: number, message: string): ReturnType<LotoFetch> {
  return reply(status, { statusCode: status, message, error: "Mock" });
}

/** Locked ids plus every device whose parent chain reaches one, sorted. */
function expand(locked: ReadonlySet<string>, devices: DeviceParents): string[] {
  const reaches = (id: string, seen: Set<string>): boolean => {
    if (locked.has(id)) return true;
    const parent = devices[id]?.parent;
    if (parent === undefined || parent === null || seen.has(parent)) return false;
    return reaches(parent, seen.add(id));
  };
  const ids = new Set([...locked, ...Object.keys(devices).filter((id) => reaches(id, new Set()))]);
  return [...ids].sort();
}

/**
 * @param devices current topology's devices (read per call — topology can refetch)
 * @param now clock, injectable for tests
 */
export function createMockLotoFetch(devices: () => DeviceParents, now: () => Date = () => new Date()): LotoFetch {
  const rows: Lock[] = [];
  const active = (): Lock[] => rows.filter((r) => r.cleared_at === null);

  return (url, init) => {
    const [path = "", query = ""] = url.split("?");
    return match({ method: init.method ?? "GET", path })
      .with({ method: "GET", path: P.when((p) => p.endsWith("/loto")) }, () =>
        reply(200, { locks: active(), locked_devices: expand(new Set(active().map((r) => r.device_id)), devices()) }),
      )
      .with({ method: "GET", path: P.when((p) => p.endsWith("/loto/history")) }, () => {
        const deviceId = new URLSearchParams(query).get("device_id") ?? "";
        return reply(200, rows.filter((r) => r.device_id === deviceId).reverse());
      })
      .with({ method: "POST", path: P.when((p) => LOCK_ROUTE.test(p)) }, ({ path: p }) => {
        const deviceId = decodeURIComponent(LOCK_ROUTE.exec(p)?.[1] ?? "");
        const body = JSON.parse(init.body ?? "{}") as { holder_name?: string; permit_ref?: string | null };
        const holder = (body.holder_name ?? "").trim();
        if (holder === "" || holder.length > MAX_TEXT) return problem(400, "holder_name must be 1–120 characters");
        if (!(deviceId in devices())) return problem(404, `device ${deviceId} is not in the topology`);
        const same = (r: Lock): boolean => r.device_id === deviceId && r.holder_name.toLowerCase() === holder.toLowerCase();
        if (active().some(same)) return problem(409, "holder already holds an active lock");
        const lock: Lock = {
          id: rows.length + 1,
          device_id: deviceId,
          holder_name: holder,
          permit_ref: body.permit_ref?.trim() || null,
          set_at: now().toISOString(),
          set_by_role: "operator",
          cleared_at: null,
          cleared_by_role: null,
        };
        rows.push(lock);
        return reply(201, lock);
      })
      .with({ method: "DELETE", path: P.when((p) => CLEAR_ROUTE.test(p)) }, ({ path: p }) => {
        const index = rows.findIndex((r) => r.id === Number(CLEAR_ROUTE.exec(p)?.[1]));
        const row = rows[index];
        if (row === undefined) return problem(404, "no such lock");
        if (row.cleared_at !== null) return problem(409, "lock already cleared");
        const cleared: Lock = { ...row, cleared_at: now().toISOString(), cleared_by_role: "operator" };
        rows[index] = cleared;
        return reply(200, cleared);
      })
      .otherwise(() => problem(404, `mock LOTO has no route for ${path}`));
  };
}
