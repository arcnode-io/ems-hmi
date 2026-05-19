/**
 * Pure helpers that fold alarm + envelope state into the inputs SldRenderer
 * expects.
 */

import { match } from "ts-pattern";
import type { Theme } from "../../../../theme/tokens";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { OperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";
import type { DOEState } from "../../../../components/composed/DOEHeadroomRow/DOEHeadroomRow";
import type { SldNodeStatus, PoiOverlay } from "../layout/SldRenderer";

function elevateSeverity(
  current: SldNodeStatus | undefined,
  incoming: ActiveAlarm["severity"],
): SldNodeStatus {
  if (incoming === "alarm" || current === "alarm") return "alarm";
  return "warn";
}

/** Fold an alarm list into deviceId → highest severity. */
export function foldAlarmsToStatus(
  alarms: readonly ActiveAlarm[],
): Record<string, SldNodeStatus> {
  const byDevice: Record<string, SldNodeStatus> = {};
  for (const alarm of alarms) {
    byDevice[alarm.deviceId] = elevateSeverity(byDevice[alarm.deviceId], alarm.severity);
  }
  return byDevice;
}

export function statusColorsFromTheme(t: Theme): Record<SldNodeStatus, string> {
  return {
    ok: t.statusOk,
    warn: t.statusWarn,
    alarm: t.statusAlarm,
    offline: t.statusOffline,
  };
}

function stateTokenLabel(state: DOEState): string {
  return match(state)
    .with("stale", () => "STALE")
    .with("invalid", () => "INVALID")
    .with("comm-fail", () => "COMM FAIL")
    .with("island", () => "ISLAND")
    .with("ok", () => "OK")
    .exhaustive();
}

// UTILITY-FEEDS §7 severity mapping.
function stateTokenColor(state: DOEState, t: Theme): string {
  return match(state)
    .with("ok", "island", () => t.textSoft)
    .with("stale", () => t.statusWarn)
    .with("invalid", "comm-fail", () => t.statusAlarm)
    .exhaustive();
}

export function buildPoiOverlay(envelope: OperatingEnvelope, t: Theme): PoiOverlay {
  return {
    settlement: envelope.settlement,
    stateToken: stateTokenLabel(envelope.doeState),
    stateColor: stateTokenColor(envelope.doeState, t),
  };
}
