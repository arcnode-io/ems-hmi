/**
 * ComputeHero — 3-up KPI strip at the top of the Compute screen.
 * Cluster util %, total draw kW, headroom kW.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { MOCK_COMPUTE } from "../data/mockCompute";

interface KpiProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  showDivider: boolean;
}

function Kpi({ label, value, unit, color, showDivider }: KpiProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[3],
        borderRightWidth: showDivider ? 1 : 0,
        borderRightColor: t.borderSoft,
      }}
    >
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 2 }}>
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { fontSize: 22, color, letterSpacing: -0.3 },
          ]}
        >
          {value}
        </Text>
        <Text style={[resolveTypeStyle(t, "label"), { fontSize: 10, color: t.textMid }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

export function ComputeHero(): React.ReactElement {
  const t = useTheme();
  const c = MOCK_COMPUTE.cluster;
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[2],
        flexDirection: "row",
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
      }}
    >
      <Kpi label="Cluster util" value={`${c.util}`} unit="%" color={t.colorCompute} showDivider />
      <Kpi label="Draw" value={c.drawKw.toFixed(1)} unit="kW" color={t.text} showDivider />
      <Kpi label="Headroom" value={c.headroomKw.toFixed(1)} unit="kW" color={t.text} showDivider={false} />
    </View>
  );
}

// Suppress unused-style-import warning until further visual polish lands.
export type { Theme };
