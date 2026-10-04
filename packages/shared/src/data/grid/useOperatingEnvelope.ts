/**
 * useOperatingEnvelope — the site's dynamic operating envelope (CSIP-AUS
 * opModImpLimW / opModExpLimW — an extension, not base IEEE 2030.5) and
 * the headroom left inside it. Subscribes to:
 *
 *   - `operating_envelope.import_limit` / `export_limit` / `status`
 *     (der-control-api; status is OK|STALE from the envelope's own
 *     validity window, published on transitions only)
 *   - `bess_module.import_headroom` / `export_headroom` (gateway-computed,
 *     referenced to POI net power — site-wide, so every module carries the
 *     same value; the first one reporting wins)
 *
 * Headroom is read, never computed here: the gateway's number is the one
 * its control law clamps against, so the HMI shows exactly that.
 */

import { useMemo } from "react";
import { match } from "ts-pattern";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export type EnvelopeStatus = "ok" | "stale" | "invalid" | "comm-fail";

export interface OperatingEnvelope {
  /** null until der-control-api has published a status — "nothing yet", not stale. */
  status: EnvelopeStatus | null;
  importLimitW: number | null;
  exportLimitW: number | null;
  importHeadroomW: number | null;
  exportHeadroomW: number | null;
  /** Share of the import limit in use, [0..1]. null when there's no limit to divide by. */
  usedFraction: number | null;
}

export interface RawEnvelope {
  importLimitW: number | null;
  exportLimitW: number | null;
  importHeadroomW: number | null;
  exportHeadroomW: number | null;
  status: string | undefined;
}

/**
 * Pure fold of the raw readings into the envelope shape.
 * @param raw latest value per topic role
 * @returns OperatingEnvelope
 */
// Reason: the gateway holds POI *at* the limit; its control loop settles up
// to ~1 kW either side (measured −930…+477 W at a 0 W limit). Calling that
// "over limit" is noise, not a breach. 2 kW ≈ 0.2% of a ~1 MW site.
const AT_LIMIT_TOLERANCE_W = 2000;

/** True only for a real breach — headroom more than the jitter tolerance below zero. */
export function isOverLimit(headroomW: number): boolean {
  return headroomW <= -AT_LIMIT_TOLERANCE_W;
}

export function envelopeFrom(raw: RawEnvelope): OperatingEnvelope {
  const status = match<string | undefined, EnvelopeStatus | null>(raw.status)
    .with("OK", () => "ok")
    .with("STALE", () => "stale")
    .with("INVALID", () => "invalid")
    .with("COMM_FAIL", () => "comm-fail")
    .otherwise(() => null);
  // Reason: used = limit − headroom, from the gateway's own two numbers, so
  // the bar agrees with whatever the gateway referenced headroom to.
  // Negative headroom = over the limit, i.e. fully used — including a limit
  // closed to 0 W, where the ratio itself would divide by zero.
  const { importLimitW: limit, importHeadroomW: headroom } = raw;
  const usedFraction =
    limit === null || headroom === null
      ? null
      : headroom < 0
        ? 1
        : limit > 0
          ? Math.min(1, Math.max(0, (limit - headroom) / limit))
          : null;
  return {
    status,
    importLimitW: raw.importLimitW,
    exportLimitW: raw.exportLimitW,
    importHeadroomW: raw.importHeadroomW,
    exportHeadroomW: raw.exportHeadroomW,
    usedFraction,
  };
}

const SOURCES = {
  operating_envelope: ["import_limit", "export_limit", "status"],
  bess_module: ["import_headroom", "export_headroom"],
} as const;

/**
 * Subscribe to the envelope + headroom feeds.
 * @returns OperatingEnvelope — null fields until each feed first reports
 */
export function useOperatingEnvelope(): OperatingEnvelope {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      const names = device.template === "operating_envelope" || device.template === "bess_module"
        ? SOURCES[device.template]
        : [];
      const tpl = view.templates_used[device.template];
      for (const name of names) {
        const m = tpl?.measurements[name];
        if (m) list.push(measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
      }
    }
    return list;
  }, [view, siteId]);

  const messages = useAggregateMeasurements<number | string>(topics);

  return useMemo(() => {
    const raw: RawEnvelope = {
      importLimitW: null,
      exportLimitW: null,
      importHeadroomW: null,
      exportHeadroomW: null,
      status: undefined,
    };
    for (const topic of topics) {
      const v = messages[topic]?.value;
      if (v === undefined) continue;
      if (topic.endsWith("/import_limit/watts") && typeof v === "number") raw.importLimitW = v;
      else if (topic.endsWith("/export_limit/watts") && typeof v === "number") raw.exportLimitW = v;
      else if (topic.endsWith("/status/none") && typeof v === "string") raw.status = v;
      else if (topic.endsWith("/import_headroom/watts") && typeof v === "number") raw.importHeadroomW ??= v;
      else if (topic.endsWith("/export_headroom/watts") && typeof v === "number") raw.exportHeadroomW ??= v;
    }
    return envelopeFrom(raw);
  }, [topics, messages]);
}
