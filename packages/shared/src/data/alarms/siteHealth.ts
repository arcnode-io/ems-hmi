/**
 * Site health from alarm evidence + coverage (constitution §3.4: unknown is a
 * state). Alarms are evidence and always win. "Nominal" needs proof: every
 * monitored reading reported, none unprovisioned, at least one limit set —
 * an empty alarm list from a silent site is unknown, never nominal.
 */

import type { ActiveAlarm } from "./useAlarms";

export interface SiteHealthInput {
  alarms: readonly ActiveAlarm[];
  watched: number;
  reporting: number;
  unprovisioned: number;
}

export type UnknownReason =
  | { kind: "unprovisioned"; count: number }
  | { kind: "no_limits" }
  | { kind: "partial"; reporting: number; watched: number };

export interface SiteHealth {
  level: "alarm" | "warn" | "nominal" | "unknown";
  alarmCount: number;
  warnCount: number;
  reason: UnknownReason | null;
}

function unknownReason({ watched, reporting, unprovisioned }: SiteHealthInput): UnknownReason | null {
  if (unprovisioned > 0) return { kind: "unprovisioned", count: unprovisioned };
  if (watched === 0) return { kind: "no_limits" };
  if (reporting < watched) return { kind: "partial", reporting, watched };
  return null;
}

/**
 * @param input.watched readings with alarm limits; input.reporting how many of them have a value
 * @example siteHealth({ alarms: [], watched: 0, reporting: 0, unprovisioned: 0 }).level // "unknown"
 */
export function siteHealth(input: SiteHealthInput): SiteHealth {
  const alarmCount = input.alarms.filter((a) => a.severity === "alarm").length;
  const warnCount = input.alarms.filter((a) => a.severity === "warn").length;
  const reason = unknownReason(input);
  const level = alarmCount > 0 ? "alarm" : warnCount > 0 ? "warn" : reason ? "unknown" : "nominal";
  return { level, alarmCount, warnCount, reason };
}
