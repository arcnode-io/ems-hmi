/**
 * CurtailmentBanner — shown only while der_dispatch.event_active is true.
 * The cap itself (target_active_power) renders in DispatchStatusPanel;
 * this banner is just the "an event is on" callout. Mirrors
 * grid-features.jsx CurtailmentBanner, minus fields with no real source
 * yet (reductionPct, BESS-covers-it / GPU-impact reassurances — those
 * need the historical/aggregation work still pending on the backend side).
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GridState } from "../../../../data/grid/useGridState";

export function CurtailmentBanner({ state }: { state: GridState }): React.ReactElement | null {
  const t = useTheme();
  if (!state.curtailmentActive) return null;
  const capMw =
    state.curtailmentCapW === null ? null : Math.abs(state.curtailmentCapW) / 1_000_000;

  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        padding: SPACE[3],
        borderRadius: RADIUS[3],
        borderWidth: 1,
        borderColor: t.statusWarn + "66",
        borderLeftWidth: 3,
        borderLeftColor: t.statusWarn,
        backgroundColor: t.statusWarn + "1f",
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.statusWarn }} />
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.statusWarn }]}>
        Curtailment active
      </Text>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, flex: 1 }]}>
        {capMw === null ? "Utility has requested a cap." : `Held under a ${capMw.toFixed(2)} MW cap.`}
      </Text>
    </View>
  );
}
