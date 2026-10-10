/** MetricCell — one labelled live value in ModuleCard's 3-column grid. */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import type { ModuleMeasurement } from "./ModuleCard";

function resolveMetricColor(t: Theme, hint?: string): string {
  if (!hint) return t.text;
  return match(hint)
    .with("bess", () => t.colorBess)
    .with("compute", () => t.colorCompute)
    .with("grid", () => t.colorGrid)
    .with("thermal", () => t.colorThermal)
    .with("ok", () => t.statusOk)
    .with("warn", () => t.statusWarn)
    .with("alarm", () => t.statusAlarm)
    .with("soft", () => t.textSoft)
    .otherwise(() => t.text);
}

interface MetricCellProps {
  m: ModuleMeasurement;
  showDivider: boolean;
}

export function MetricCell({ m, showDivider }: MetricCellProps): React.ReactElement {
  const t = useTheme();
  const valueColor = resolveMetricColor(t, m.colorHint);
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
        borderRightWidth: showDivider ? 1 : 0,
        borderRightColor: t.borderSoft,
      }}
    >
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "kpiLabel"),
          { fontSize: 9, color: t.textSoft },
        ]}
      >
        {m.label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 2,
          marginTop: 2,
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "kpiValue"),
            {
              fontSize: 16,
              letterSpacing: -0.3,
              color: valueColor,
            },
          ]}
        >
          {m.value}
        </Text>
        {m.unit ? (
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 10, color: t.textMid },
            ]}
          >
            {m.unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
