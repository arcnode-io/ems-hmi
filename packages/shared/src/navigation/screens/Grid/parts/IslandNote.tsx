/**
 * IslandNote — planned vs fault island qualifier block. Handoff rule 4:
 * ISLAND always carries a qualifier, never rendered bare. Rendered only
 * while state.mode === "ISLAND" (caller's responsibility).
 *
 * Anti-islanding armed/inactive state (rule 5) isn't shown here — that's
 * pending the protective_relay fields power-engineer is building; this
 * note sticks to what interconnect_state alone tells us.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GridState } from "../../../../data/grid/useGridState";

export function IslandNote({ state }: { state: GridState }): React.ReactElement | null {
  const t = useTheme();
  if (state.mode !== "ISLAND") return null;
  const fault = state.islandQualifier === "fault";
  const color = fault ? t.statusAlarm : t.statusWarn;
  const headline = fault ? "Unplanned · fault" : "Ride-through active";
  const body = fault
    ? "PCC breaker tripped. The gateway lost utility reference — the PCS fleet is grid-forming off the BESS until the fault clears and the breaker recloses."
    : "PCC breaker open by design. The site is running on its own reference while separated from the utility.";

  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        padding: SPACE[3],
        borderRadius: RADIUS[3],
        borderWidth: 1,
        borderColor: color + "55",
        borderLeftWidth: 3,
        borderLeftColor: color,
        backgroundColor: color + "0c",
        gap: 4,
      }}
    >
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color }]}>ISLAND · {headline}</Text>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}>{body}</Text>
    </View>
  );
}
