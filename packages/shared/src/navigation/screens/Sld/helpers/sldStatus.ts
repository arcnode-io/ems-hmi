/**
 * Pure helpers that fold alarm + grid-mode state into the inputs
 * SldRenderer expects.
 */

import type { Theme } from "../../../../theme/tokens";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { GridModeState } from "../../../../data/grid/useGridMode";
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

/**
 * @param curtailed der_dispatch.event_active — real (see useDerEventActive).
 *   Takes priority over the plain OK token, since it's the more actionable
 *   fact; ISLAND still wins over both. No DOE fault states (STALE/INVALID/
 *   COMM_FAIL) — operating_envelope is gone entirely (ArcNode has no
 *   visibility into it on the real system; see ~/arcnode/ems/readme.md),
 *   so mode/curtailed are the only two POI-state inputs now.
 */
export function buildPoiOverlay(
  gridMode: GridModeState,
  t: Theme,
  curtailed: boolean,
): PoiOverlay {
  const isIsland = gridMode.mode === "ISLAND";
  const stateToken = isIsland ? "ISLAND" : curtailed ? "CURTAILED" : "OK";
  const stateColor = !isIsland && curtailed ? t.statusWarn : t.textSoft;
  return {
    settlement: gridMode.settlement,
    stateToken,
    stateColor,
  };
}
