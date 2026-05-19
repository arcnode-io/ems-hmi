/**
 * useConnectionTest — probes the real services the HMI talks to and reports
 * per-service status + round-trip latency. Returns one row per service so
 * the Settings panel can render them uniformly via TestResultRow.
 *
 * Today only the Analyst API is reachable in dev/demo. Device API + MQTT
 * broker land when those backends ship — when they do, push another entry
 * onto SERVICES and they show up automatically.
 *
 * The hook never throws — failures resolve to status:"error" with the
 * reason in `detail`. The Settings panel renders all states uniformly.
 */

import { useCallback, useState } from "react";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";

export type ConnStatus = "ok" | "error" | "pending";

export interface ConnResult {
  name: string;
  status: ConnStatus;
  /** Short string suffix shown in the row (`connected · 24ms`, `404`, …). */
  detail: string;
}

interface ProbeSpec {
  name: string;
  /** Builds the URL to probe given a deployment identity. */
  url: (identity: { chatApiUri: string; deviceApiUri: string }) => string;
}

const SERVICES: ProbeSpec[] = [
  // Reason: per PM note, demo only actually connects to the Analyst API.
  // Device API + MQTT broker are mocked locally today; reintroduce probes
  // when they're real services so this surface stays honest.
  // Probe /health (the contract the AI engineer publishes for proxy/k8s
  // liveness). Server also returns "ok" on root, but /health is canonical.
  { name: "Analyst API", url: (id) => `${id.chatApiUri}/health` },
];

/**
 * Issue a HEAD (or GET fallback) request and time the round-trip.
 * Resolves to a structured result regardless of network outcome.
 */
async function probe(url: string): Promise<{ ok: boolean; ms: number; detail: string }> {
  const started = performance.now();
  try {
    const response = await fetch(url, { method: "GET", mode: "cors" });
    const ms = Math.round(performance.now() - started);
    if (!response.ok) {
      return { ok: false, ms, detail: `HTTP ${response.status}` };
    }
    return { ok: true, ms, detail: `connected · ${ms}ms` };
  } catch (e: unknown) {
    const ms = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : "network error";
    return { ok: false, ms, detail: msg.slice(0, 40) };
  }
}

export interface UseConnectionTestResult {
  results: ConnResult[];
  testing: boolean;
  /** Re-run all probes. */
  run: () => Promise<void>;
}

/**
 * Stateful hook returning probe results + a `run()` callback.
 * @returns ConnectionTest state
 */
export function useConnectionTest(): UseConnectionTestResult {
  const identity = useDeploymentIdentity();
  const [results, setResults] = useState<ConnResult[]>(
    SERVICES.map((s) => ({ name: s.name, status: "pending", detail: "not yet tested" })),
  );
  const [testing, setTesting] = useState(false);

  const run = useCallback(async (): Promise<void> => {
    setTesting(true);
    setResults(
      SERVICES.map((s) => ({ name: s.name, status: "pending", detail: "testing…" })),
    );
    const out: ConnResult[] = [];
    for (const svc of SERVICES) {
      const url = svc.url(identity);
      const probed = await probe(url);
      out.push({
        name: svc.name,
        status: probed.ok ? "ok" : "error",
        detail: probed.detail,
      });
    }
    setResults(out);
    setTesting(false);
  }, [identity]);

  return { results, testing, run };
}
