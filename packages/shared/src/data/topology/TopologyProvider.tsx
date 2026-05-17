/**
 * TopologyProvider — fetches /topology/view at mount, validates with Zod,
 * exposes the projection via React Context. See system_adr §22.
 *
 * Component-level error states: 'loading' on first mount, 'ready' on success,
 * 'error' on network/HTTP/schema failure. Consumers branch via useTopologyView().
 */

import React, { createContext, useEffect, useState } from "react";
import { TopologyView, type TopologyViewType } from "./topology.schema";

export type TopologyStatus = "loading" | "ready" | "error";

export interface TopologyContextValue {
  status: TopologyStatus;
  view: TopologyViewType | null;
  error: string | null;
  refetch: () => void;
}

export const TopologyContext = createContext<TopologyContextValue | null>(null);

interface TopologyProviderProps {
  viewUrl: string;
  children: React.ReactNode;
}

/**
 * Fetch + validate the topology view. Exposed for tests + the refetch path.
 * @param viewUrl Absolute or same-origin URL pointing at /topology/view JSON
 * @returns Validated TopologyView
 * @throws Error on HTTP failure or schema validation failure
 */
export async function fetchTopologyView(
  viewUrl: string,
): Promise<TopologyViewType> {
  const response = await fetch(viewUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${viewUrl}`);
  }
  const raw: unknown = await response.json();
  return TopologyView.parse(raw);
}

/**
 * Provides topology context to descendants. Fetches once on mount.
 * @param props viewUrl + children
 * @param props.viewUrl URL to fetch the topology view from
 * @param props.children Subtree that gets access via useTopologyView()
 * @returns Context provider element
 */
export function TopologyProvider({
  viewUrl,
  children,
}: TopologyProviderProps): React.ReactElement {
  const [status, setStatus] = useState<TopologyStatus>("loading");
  const [view, setView] = useState<TopologyViewType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchTopologyView(viewUrl)
      .then((v) => {
        if (cancelled) return;
        setView(v);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "unknown error");
        setStatus("error");
      });
    return (): void => {
      cancelled = true;
    };
  }, [viewUrl, refetchKey]);

  const value: TopologyContextValue = {
    status,
    view,
    error,
    refetch: (): void => setRefetchKey((k) => k + 1),
  };

  return (
    <TopologyContext.Provider value={value}>
      {children}
    </TopologyContext.Provider>
  );
}
