/**
 * EnergyFlowDiagram — Sankey-style vertical flow of power between sources
 * (PV, BESS) and sinks (Compute, Grid export). Heavy bespoke SVG; stubbed
 * here with a simple legend + value strip until the full Sankey lands.
 *
 * TODO: port the full vertical Sankey from updated-handoff/03-screens/
 * energy-detail-screen.jsx (lines 124-340). Tracked in step 9b.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { EDPanel } from "./EDPanel";

interface FlowRow {
  source: string;
  sink: string;
  kw: number;
  color: string;
}

export function EnergyFlowDiagram(): React.ReactElement {
  const t = useTheme();
  // Reason: hardcoded snapshot until per-device active_power aggregation
  // hook lands. Sources / sinks come from constitution rule 3.5 — visible
  // values are aggregates with explicit qualifier.
  const flows: FlowRow[] = [
    { source: "PV", sink: "Compute", kw: 2080, color: t.colorThermal },
    { source: "PV", sink: "Grid export", kw: 760, color: t.colorGrid },
    { source: "BESS", sink: "Compute", kw: 1620, color: t.colorBess },
  ];
  return (
    <EDPanel>
      <View style={{ padding: SPACE[3], gap: SPACE[2] }}>
        {flows.map((flow, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACE[2],
            }}
          >
            <View
              style={{
                width: 6,
                height: 22,
                backgroundColor: flow.color,
                borderRadius: 1,
              }}
            />
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                {
                  fontSize: 11,
                  color: t.text,
                  letterSpacing: 0.1,
                  flex: 1,
                  minWidth: 0,
                },
              ]}
              numberOfLines={1}
            >
              {flow.source} → {flow.sink}
            </Text>
            <Text
              style={[
                resolveTypeStyle(t, "kpiValue"),
                {
                  fontSize: 14,
                  color: t.text,
                  letterSpacing: -0.2,
                },
              ]}
            >
              {flow.kw.toLocaleString()}
            </Text>
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                { fontSize: 9, color: t.textMid },
              ]}
            >
              kW
            </Text>
          </View>
        ))}
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textSoft, marginTop: SPACE[1], fontSize: 10 },
          ]}
        >
          Full Sankey visualization pending port (step 9b).
        </Text>
      </View>
    </EDPanel>
  );
}
