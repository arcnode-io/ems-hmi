/**
 * InterconnectPanel — PCC breaker + site mode + net-at-meter + PV output.
 * Frequency moved to FrequencyVoltagePanel (power-quality concern).
 * Mirrors grid-detail-desktop.jsx PcsPanel, minus site load + BESS — see
 * useGridState's doc comment for why those two stay deferred.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GridState } from "../../../../data/grid/useGridState";
import { GridPanel, GridRow } from "./GridPanel";

function fmtPower(watts: number | null): { v: string; u: string } {
  if (watts === null || !Number.isFinite(watts)) return { v: "—", u: "" };
  const abs = Math.abs(watts);
  const sign = watts >= 0 ? "+" : "−";
  return abs >= 1_000_000
    ? { v: `${sign}${(abs / 1_000_000).toFixed(2)}`, u: "MW" }
    : { v: `${sign}${(abs / 1000).toFixed(0)}`, u: "kW" };
}

interface InterconnectPanelProps {
  state: GridState;
}

export function InterconnectPanel({ state }: InterconnectPanelProps): React.ReactElement {
  const t = useTheme();
  const islanded = state.mode === "ISLAND";
  const modeColor = !islanded ? t.statusOk : state.islandQualifier === "fault" ? t.statusAlarm : t.statusWarn;
  const modeLabel = islanded ? "GRID-FORMING" : "GRID-FOLLOWING";
  const net = fmtPower(state.netActivePowerW);

  return (
    <GridPanel title="Interconnect" meta="PCC">
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: RADIUS[2],
            backgroundColor: modeColor + "18",
            borderWidth: 1,
            borderColor: modeColor + "55",
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: modeColor }} />
          <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: modeColor }]}>{modeLabel}</Text>
        </View>
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, flex: 1 }]}>
          {islanded ? "PCS fleet holding site frequency" : "PCS fleet following utility reference"}
        </Text>
      </View>

      <GridRow
        k="PCC breaker"
        v={state.breakerState ?? "—"}
        tone={
          state.breakerState === null
            ? "soft"
            : state.breakerState === "CLOSED"
              ? "ok"
              : state.breakerState === "TRIPPED"
                ? "alarm"
                : "warn"
        }
      />
      <GridRow
        k="Net at meter"
        v={net.v}
        u={net.u}
        hint={
          state.netActivePowerW === null
            ? undefined
            : state.netActivePowerW > 0
              ? "importing"
              : "exporting"
        }
      />
      {state.pvOutputW !== null ? (
        <GridRow
          k="PV output"
          v={(state.pvOutputW / 1_000_000).toFixed(2)}
          u="MW"
        />
      ) : null}
    </GridPanel>
  );
}
