/**
 * Pure helpers that fold alarm + envelope state into the inputs `SldRenderer`
 * expects (status-per-device, POI overlay). Keeping these out of the React
 * component lets us unit-test the mapping logic without rendering.
 */

import { match } from "ts-pattern";
import type { Theme } from "../../../../theme/tokens";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { OperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";
import type { DOEState } from "../../../../components/composed/DOEHeadroomRow/DOEHeadroomRow";
import type { SldNodeStatus, PoiOverlay } from "../layout/SldRenderer";

/**
 * Combine an existing per-device severity with an incoming one, returning the
 * higher of the two. `alarm` always wins; otherwise `warn`.
 */
function elevateSeverity(
  current: SldNodeStatus | undefined,
  incoming: ActiveAlarm["severity"],
): SldNodeStatus {
  if (incoming === "alarm" || current === "alarm") return "alarm";
  return "warn";
}

/**
 * Fold an alarm list into a deviceId → highest-severity map.
 */
export function foldAlarmsToStatus(
  alarms: readonly ActiveAlarm[],
): Record<string, SldNodeStatus> {
  const byDevice: Record<string, SldNodeStatus> = {};
  for (const alarm of alarms) {
    byDevice[alarm.deviceId] = elevateSeverity(byDevice[alarm.deviceId], alarm.severity);
  }
  return byDevice;
}

/**
 * Theme-resolved colors keyed by SldNodeStatus. Stable identity across renders
 * via shallow-equal inputs.
 */
export function statusColorsFromTheme(t: Theme): Record<SldNodeStatus, string> {
  return {
    ok: t.statusOk,
    warn: t.statusWarn,
    alarm: t.statusAlarm,
    offline: t.statusOffline,
  };
}

/**
 * Uppercase label rendered in the POI state-token slot.
 */
function stateTokenLabel(state: DOEState): string {
  return match(state)
    .with("stale", () => "STALE")
    .with("invalid", () => "INVALID")
    .with("comm-fail", () => "COMM FAIL")
    .with("island", () => "ISLAND")
    .with("ok", () => "OK")
    .exhaustive();
}

/**
 * Severity-mapped fill color for the POI state-token. `ok` / `island` are
 * informational (textSoft); `stale` elevates to warn; `invalid` / `comm-fail`
 * elevate to alarm — mirrors UTILITY-FEEDS §7.
 */
function stateTokenColor(state: DOEState, t: Theme): string {
  return match(state)
    .with("ok", "island", () => t.textSoft)
    .with("stale", () => t.statusWarn)
    .with("invalid", "comm-fail", () => t.statusAlarm)
    .exhaustive();
}

/**
 * Derive the `PoiOverlay` payload SldRenderer consumes from the envelope hook.
 */
export function buildPoiOverlay(envelope: OperatingEnvelope, t: Theme): PoiOverlay {
  return {
    settlement: envelope.settlement,
    stateToken: stateTokenLabel(envelope.doeState),
    stateColor: stateTokenColor(envelope.doeState, t),
  };
}
