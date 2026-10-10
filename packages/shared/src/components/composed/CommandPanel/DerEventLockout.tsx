/** DerEventLockout — why CommandPanel shows no setpoint controls during a DER event. */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

export function DerEventLockout(): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ region: "der-event-lockout" }}
      style={{
        padding: SPACE[3],
        borderRadius: RADIUS[2],
        borderWidth: 1,
        borderColor: t.statusWarn + "55",
        backgroundColor: t.statusWarn + "14",
        gap: 4,
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { color: t.statusWarn, fontWeight: "700", letterSpacing: 0.1 },
        ]}
      >
        Dispatch locked — DER event active
      </Text>
      <Text style={[resolveTypeStyle(t, "caption"), { color: t.textMid }]}>
        der-control-api owns this setpoint until the utility curtailment event clears.
      </Text>
    </View>
  );
}
