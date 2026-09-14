/**
 * BessAlarmsPanel — active alarms for a bess_module and its bess_rack
 * children, reusing the same useAlarms + AlarmRow pattern as Overview's
 * AlarmsPanel. No BMS-specific alarm codes exist for real (no cell-level
 * telemetry) — these are the same generic threshold-crossing alarms
 * every device gets.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { AlarmRow } from "../../../../components/composed/AlarmRow/AlarmRow";
import { useAlarms } from "../../../../data/alarms/useAlarms";

function relativeAge(isoTs: string): string {
  const then = Date.parse(isoTs);
  if (!Number.isFinite(then)) return "just now";
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 90) return `${Math.round(seconds)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMin = Math.round(minutes - hours * 60);
  return `${hours}h ${remMin.toString().padStart(2, "0")}m ago`;
}

interface BessAlarmsPanelProps {
  deviceIds: readonly string[];
}

export function BessAlarmsPanel({ deviceIds }: BessAlarmsPanelProps): React.ReactElement {
  const t = useTheme();
  const allAlarms = useAlarms();
  const alarms = allAlarms.filter((a) => deviceIds.includes(a.deviceId));

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View style={{ paddingVertical: SPACE[2], paddingHorizontal: SPACE[3] }}>
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          Alarms · {alarms.length}
        </Text>
      </View>
      {alarms.length === 0 ? (
        <View style={{ paddingHorizontal: SPACE[3], paddingBottom: SPACE[3] }}>
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
            No active alarms on this module or its racks.
          </Text>
        </View>
      ) : (
        alarms.map((a) => (
          <AlarmRow
            key={`${a.deviceId}:${a.measurementName}`}
            severity={a.severity}
            acknowledged={false}
            device={a.deviceDisplayName}
            name={a.measurementLabel}
            value={a.displayValue}
            age={relativeAge(a.ts)}
          />
        ))
      )}
    </View>
  );
}
