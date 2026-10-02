/**
 * ComputeAlarmsBlock — live alarms on gpu_node / compute_module devices.
 * Reuses the canonical AlarmRow (Layer 7), same as the Overview AlarmsPanel.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { AlarmRow } from "../../../../components/composed/AlarmRow/AlarmRow";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { useAlarms } from "../../../../data/alarms/useAlarms";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { relativeAge } from "../../Overview/parts/AlarmsPanel";
import { computeAlarms } from "./computeView";

export function ComputeAlarmsBlock(): React.ReactElement {
  const t = useTheme();
  const { view } = useTopologyView();
  const alarms = computeAlarms(useAlarms(), (id) => view?.devices[id]?.template);
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[2],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      {alarms.length === 0 ? (
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft, padding: SPACE[3] }]}>
          No active compute alarms.
        </Text>
      ) : (
        alarms.map((alarm) => (
          <AlarmRow
            key={`${alarm.deviceId}:${alarm.measurementName}`}
            severity={alarm.severity}
            acknowledged={false}
            device={alarm.deviceDisplayName}
            name={alarm.measurementLabel}
            value={alarm.displayValue}
            category={alarm.category}
            age={relativeAge(alarm.ts)}
          />
        ))
      )}
    </View>
  );
}
