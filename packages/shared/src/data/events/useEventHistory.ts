/**
 * useEventHistory — the last 24 h of der-control-api's event log, newest
 * first, re-read every REFRESH_MS. Stays loading until there's a session token.
 */

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { BROWSER_FETCH, fetchEvents, type EventRow, type EventsFetch } from "./eventsApi";

// Reason: events land on HTTP only (no bus topic); 5 s keeps a new DER event
// on screen within one beat of the banner without hammering the API.
export const REFRESH_MS = 5000;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type EventHistory =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rows: EventRow[] };

/**
 * @param fetchFn injectable for tests; defaults to the browser's fetch
 * @returns the log newest first, or why there isn't one
 */
export function useEventHistory(fetchFn: EventsFetch = BROWSER_FETCH): EventHistory {
  const { derControlUri } = useDeploymentIdentity();
  // Reason: read the context directly — useAuth() throws outside an AuthProvider.
  const token = useContext(AuthContext)?.token ?? null;
  const [history, setHistory] = useState<EventHistory>({ status: "loading" });
  useEffect(() => {
    if (token === null) return undefined;
    let current = true;
    const load = (): void => {
      fetchEvents({ baseUri: derControlUri, token, sinceMs: Date.now() - WINDOW_MS }, fetchFn).then(
        (rows) => {
          if (current) setHistory({ status: "ready", rows: [...rows].reverse() });
        },
        () => {
          if (current) setHistory({ status: "error" });
        },
      );
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return (): void => {
      current = false;
      clearInterval(timer);
    };
  }, [token, derControlUri, fetchFn]);
  return history;
}
