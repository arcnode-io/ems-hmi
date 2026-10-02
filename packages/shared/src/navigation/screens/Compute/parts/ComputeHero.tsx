/**
 * ComputeHero — 3-up KPI strip at the top of the Compute screen.
 * Cluster util %, total draw kW, headroom kW.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GpuFleet } from "../../../../data/compute/useGpuFleet";
import { heroKpis } from "./computeView";

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

/** Hero KPIs. `capacityKw` = sizing P_compute_total_kW (design compute capacity). */
export function ComputeHero({ fleet, capacityKw }: { fleet: GpuFleet; capacityKw: number }): React.ReactElement {
  const t = useTheme();
  const kpis = heroKpis(fleet, capacityKw);
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
      <Kpi
        label="GPU throttle"
        {...kpis.throttling}
        color={fleet.throttlingCount > 0 ? t.statusWarn : t.colorCompute}
        showDivider
      />
      <Kpi label="Draw" {...kpis.draw} color={t.text} showDivider />
      <Kpi label="Headroom" {...kpis.headroom} color={t.text} showDivider={false} />
    </View>
  );
}

// Suppress unused-style-import warning until further visual polish lands.
export type { Theme };
