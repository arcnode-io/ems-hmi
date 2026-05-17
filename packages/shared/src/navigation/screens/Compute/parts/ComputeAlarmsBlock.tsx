/**
 * ComputeAlarmsBlock — alarms scoped to the compute cluster. Reuses the
 * canonical AlarmRow (Layer 7) — same component the Overview's
 * AlarmsPanel uses, just filtered by template.
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { AlarmRow } from "../../../../components/composed/AlarmRow/AlarmRow";
import { MOCK_COMPUTE } from "../data/mockCompute";

export function ComputeAlarmsBlock(): React.ReactElement {
  const t = useTheme();
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
      {MOCK_COMPUTE.alarms.map((a, i) => (
        <AlarmRow
          key={i}
          severity={a.severity}
          acknowledged={a.acknowledged}
          device={a.device}
          name={a.name}
          value={a.value}
          age={a.age}
        />
      ))}
    </View>
  );
}
