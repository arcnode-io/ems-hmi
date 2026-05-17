/**
 * SldProvider — fetches /topology/sld.svg at mount, holds the SVG string in
 * a React Context for SLDDiagram (and other consumers) to overlay live data
 * onto. See system_adr §6.
 *
 * SVG content is not validated client-side beyond basic shape (non-empty
 * + starts with "<"). The producer (edp-api/device-api) is the authoritative
 * SVG validator.
 */

import React, { createContext, useEffect, useState } from "react";

export type SldStatus = "loading" | "ready" | "error";

export interface SldContextValue {
  status: SldStatus;
  svg: string | null;
  error: string | null;
  refetch: () => void;
}

export const SldContext = createContext<SldContextValue | null>(null);

interface SldProviderProps {
  svgUrl: string;
  children: React.ReactNode;
}

/**
 * Fetch the SLD SVG and return it as a string. Cheap shape-check on content.
 * @param svgUrl Absolute or same-origin URL pointing at the SVG artifact
 * @returns The SVG string
 * @throws Error on HTTP failure or empty/non-SVG response
 */
export async function fetchSldSvg(svgUrl: string): Promise<string> {
  const response = await fetch(svgUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${svgUrl}`);
  }
  const body = await response.text();
  const trimmed = body.trimStart();
  if (trimmed === "" || !trimmed.startsWith("<")) {
    throw new Error(`response at ${svgUrl} is not SVG`);
  }
  return body;
}

/**
 * Provides SLD SVG context to descendants. Fetches once on mount.
 * @param props svgUrl + children
 * @param props.svgUrl URL to fetch the SVG from
 * @param props.children Subtree that consumes via useSldSvg()
 * @returns Context provider element
 */
export function SldProvider({
  svgUrl,
  children,
}: SldProviderProps): React.ReactElement {
  const [status, setStatus] = useState<SldStatus>("loading");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchSldSvg(svgUrl)
      .then((s) => {
        if (cancelled) return;
        setSvg(s);
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
  }, [svgUrl, refetchKey]);

  const value: SldContextValue = {
    status,
    svg,
    error,
    refetch: (): void => setRefetchKey((k) => k + 1),
  };

  return (
    <SldContext.Provider value={value}>{children}</SldContext.Provider>
  );
}
