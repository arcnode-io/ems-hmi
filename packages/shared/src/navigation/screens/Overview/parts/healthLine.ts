/** HealthBar copy from site health — unknown says why, never "nominal". */

import { match } from "ts-pattern";
import type { SiteHealth, UnknownReason } from "../../../../data/alarms/siteHealth";

export interface HealthLine {
  headline: string;
  detail: string;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

function unknownDetail(reason: UnknownReason | null): string {
  if (!reason) return "";
  return match(reason)
    .with({ kind: "unprovisioned" }, (r) => `${plural(r.count, "device")} awaiting commissioning`)
    .with({ kind: "no_limits" }, () => "No alarm limits configured")
    .with({ kind: "partial" }, (r) => `${r.reporting} of ${r.watched} monitored readings reporting`)
    .exhaustive();
}

/** @example healthLine({ level: "unknown", reason: { kind: "no_limits" }, … }, 3).headline // "Site status unknown" */
export function healthLine(health: SiteHealth, moduleCount: number): HealthLine {
  const modules = plural(moduleCount, "module");
  return match(health.level)
    .with("alarm", () => ({ headline: `${plural(health.alarmCount, "active alarm")}`, detail: modules }))
    .with("warn", () => ({ headline: `${plural(health.warnCount, "active warning")}`, detail: modules }))
    .with("nominal", () => ({ headline: "All systems nominal", detail: `${modules} · every monitored reading in limits` }))
    .with("unknown", () => ({ headline: "Site status unknown", detail: unknownDetail(health.reason) }))
    .exhaustive();
}
