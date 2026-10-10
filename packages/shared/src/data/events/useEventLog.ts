/**
 * useEventLog — the event history page's data: the newest page for the
 * current filters, older pages on demand (stable id cursor), and new events
 * merged in at the top every REFRESH_MS. Real-backend builds only.
 */

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { usesRealBackend } from "../deployment/deploymentMode";
import { BROWSER_FETCH, fetchEventPage, fetchRetentionDays, type EventRow, type EventsFetch } from "./eventsApi";
import { filterParams, type EventFilter } from "./eventFilter";
import { REFRESH_MS } from "./useEventHistory";

export type EventLog = { retentionDays: number | null } & (
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rows: EventRow[]; end: boolean; loadingOlder: boolean; loadOlder: () => void }
);

type PageState =
  | { status: "loading" | "error" }
  | { status: "ready"; rows: EventRow[]; end: boolean; loadingOlder: boolean };

/** Union by id, newest first — refresh and paging can overlap. */
function merge(current: EventRow[], incoming: EventRow[]): EventRow[] {
  const byId = new Map([...current, ...incoming].map((row) => [row.id, row]));
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

/**
 * @param filter chip selections; a change starts over from the newest page
 * @param fetchFn injectable for tests; defaults to the browser's fetch
 */
export function useEventLog(filter: EventFilter, fetchFn: EventsFetch = BROWSER_FETCH): EventLog {
  const { mode, derControlUri } = useDeploymentIdentity();
  // Reason: mock builds have no AuthProvider, and useAuth() throws outside one.
  const token = useContext(AuthContext)?.token ?? null;
  const live = usesRealBackend(mode) && token !== null;
  const [page, setPage] = useState<PageState>({ status: "loading" });
  const [retentionDays, setRetentionDays] = useState<number | null>(null);
  // Reason: the range start is fixed when the filters are picked, so older
  // pages and refreshes all ask the same question.
  const params = useRef<Record<string, string>>({});
  const filterKey = `${filter.kind}|${filter.program}|${filter.range}`;

  useEffect(() => {
    if (!live || token === null) return undefined;
    let current = true;
    void fetchRetentionDays({ baseUri: derControlUri, token }, fetchFn).then(
      (days) => current && setRetentionDays(days),
      () => undefined,
    );
    return (): void => {
      current = false;
    };
  }, [live, token, derControlUri, fetchFn]);

  useEffect(() => {
    if (!live || token === null) return undefined;
    let current = true;
    params.current = filterParams(filter, Date.now());
    setPage({ status: "loading" });
    const newest = (): void => {
      fetchEventPage({ baseUri: derControlUri, token, filters: params.current, before: null }, fetchFn).then(
        (rows) => {
          if (!current) return;
          setPage((prev) =>
            prev.status === "ready"
              ? { ...prev, rows: merge(prev.rows, rows) }
              : { status: "ready", rows: merge([], rows), end: false, loadingOlder: false },
          );
        },
        () => current && setPage((prev) => (prev.status === "ready" ? prev : { status: "error" })),
      );
    };
    newest();
    const timer = setInterval(newest, REFRESH_MS);
    return (): void => {
      current = false;
      clearInterval(timer);
    };
    // Reason: filterKey stands in for the filter object, which callers rebuild each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, token, derControlUri, fetchFn, filterKey]);

  const loadOlder = useCallback((): void => {
    if (page.status !== "ready" || page.end || page.loadingOlder || token === null) return;
    const last = page.rows.at(-1);
    if (last === undefined) {
      setPage({ ...page, end: true });
      return;
    }
    setPage({ ...page, loadingOlder: true });
    fetchEventPage({ baseUri: derControlUri, token, filters: params.current, before: last.id }, fetchFn).then(
      (rows) =>
        setPage((prev) =>
          prev.status === "ready" ? { ...prev, rows: merge(prev.rows, rows), end: rows.length === 0, loadingOlder: false } : prev,
        ),
      () => setPage((prev) => (prev.status === "ready" ? { ...prev, loadingOlder: false } : prev)),
    );
  }, [page, token, derControlUri, fetchFn]);

  if (!live) return { status: "unavailable", retentionDays: null };
  return page.status === "ready" ? { ...page, loadOlder, retentionDays } : { status: page.status, retentionDays };
}
