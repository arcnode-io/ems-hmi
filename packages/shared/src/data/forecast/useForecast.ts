/**
 * useForecast — the site's day-ahead price forecast for the Energy screen.
 * Read once on mount: the model writes a day at a time, so there's nothing
 * to poll for.
 */

import { useEffect, useRef, useState } from "react";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import type { FetchFn } from "../history/measurementsApi";
import { fetchForecast, type Forecast } from "./forecastApi";

// Reason: the hour in progress plus the day ahead the model forecasts.
const LOOKBACK_MS = 3_600_000;
const LOOKAHEAD_MS = 24 * 3_600_000;

export type PriceState = { kind: "loading" } | { kind: "unavailable" } | Forecast;

/**
 * @param fetchFn injectable for tests; defaults to the browser fetch
 */
export function useForecast(fetchFn: FetchFn = (url) => fetch(url)): PriceState {
  const { chatApiUri } = useDeploymentIdentity();
  // Reason: the default fetchFn is a fresh closure every render; reading it
  // through a ref keeps it out of the effect's deps so it fetches once.
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;
  const [state, setState] = useState<PriceState>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    const now = Date.now();
    const query = { baseUri: chatApiUri, startMs: now - LOOKBACK_MS, endMs: now + LOOKAHEAD_MS };
    fetchForecast(query, fetchRef.current).then(
      (forecast) => current && setState(forecast),
      () => current && setState({ kind: "unavailable" }),
    );
    return (): void => {
      current = false;
    };
  }, [chatApiUri]);
  return state;
}
