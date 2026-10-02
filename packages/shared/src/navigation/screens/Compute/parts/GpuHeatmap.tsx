/**
 * GpuHeatmap — one cell per gpu_node, labelled with % of its GPU caps in use
 * (GPU power ÷ summed gpu_N_power_limit). ~100 = training at max; a drop
 * under load = held back. Compute domain color (Rule 1: load isn't status);
 * only throttling goes warn.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GpuFleet, GpuNodeSummary } from "../../../../data/compute/useGpuFleet";
import { capCell } from "./computeView";

// Reason: 98 nodes = 14 × 7; still a readable cell at phone width.
const COLS = 14;
const CELL_GAP = 4;
const CELL_H = 36;

function toneColor(t: Theme, tone: ReturnType<typeof capCell>["tone"]): string {
  return match(tone)
    .with("compute", () => t.colorCompute)
    .with("warn", () => t.statusWarn)
    .with("idle", () => t.borderSoft)
    .exhaustive();
}

function Cell({ node }: { node: GpuNodeSummary }): React.ReactElement {
  const t = useTheme();
  const cell = capCell(node);
  const idle = cell.tone === "idle";
  return (
    <View
      style={{
        flex: 1,
        height: CELL_H,
        borderRadius: RADIUS[2],
        backgroundColor: toneColor(t, cell.tone),
        borderWidth: 1,
        borderColor: idle ? t.border : "transparent",
        opacity: idle ? 0.55 : 1,
        overflow: "hidden",
      }}
    >
      {/* Cap-in-use fill bar at top — reads as % visually */}
      <View
        style={{
          position: "absolute",
          left: 3,
          top: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: idle ? t.textFaint : "#fff",
          opacity: 0.85,
          width: `${Math.min(1, node.capUsed ?? 0) * 100}%`,
          maxWidth: "90%",
        }}
      />
      <View style={{ position: "absolute", bottom: 3, left: 0, right: 0, alignItems: "center" }}>
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            { fontSize: 9, fontWeight: "700", color: idle ? t.textSoft : "#fff", letterSpacing: 0 },
          ]}
        >
          {cell.label}
        </Text>
      </View>
    </View>
  );
}

export function GpuHeatmap({ fleet }: { fleet: GpuFleet }): React.ReactElement {
  const t = useTheme();
  const rows: GpuNodeSummary[][] = [];
  for (let start = 0; start < fleet.nodes.length; start += COLS) {
    rows.push(fleet.nodes.slice(start, start + COLS));
  }
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[2],
        padding: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        gap: CELL_GAP,
      }}
    >
      {rows.map((row) => (
        <View key={row[0]?.deviceId} style={{ flexDirection: "row", gap: CELL_GAP }}>
          {row.map((node) => (
            <Cell key={node.deviceId} node={node} />
          ))}
          {/* Reason: pad a short last row so its cells keep the grid width. */}
          {Array.from({ length: COLS - row.length }, (_slot, pad) => (
            <View key={`pad-${pad}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          { fontSize: 9, color: t.textSoft, marginTop: SPACE[1], letterSpacing: 0.1, textTransform: "uppercase" },
        ]}
      >
        {fleet.nodes.length} nodes · % of GPU cap in use
      </Text>
    </View>
  );
}
