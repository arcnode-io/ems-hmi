/**
 * GpuHeatmap — 4×8 matrix of compute servers. Each cell colored by util
 * via the compute domain color ramp (Rule 1: util uses domain color, not
 * status). Hover/tap → server detail (future).
 *
 * Currently mock — wire to per-server topology + measurements in step
 * 9b once compute_pod is decomposed into per-server devices.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { MOCK_COMPUTE } from "../data/mockCompute";

const COLS = 8;
const CELL_GAP = 4;
const CELL_H = 36;

function cellColor(t: Theme, util: number): { bg: string; opacity: number } {
  if (util < 5) return { bg: t.borderSoft, opacity: 0.55 };
  return {
    bg: t.colorCompute,
    opacity: 0.55 + (util / 100) * 0.45,
  };
}

interface CellProps {
  server: { id: string; util: number; draw: number };
}

function Cell({ server }: CellProps): React.ReactElement {
  const t = useTheme();
  const idle = server.util < 5;
  const { bg, opacity } = cellColor(t, server.util);
  return (
    <View
      style={{
        flex: 1,
        height: CELL_H,
        borderRadius: RADIUS[2],
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: idle ? t.border : "transparent",
        opacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Util fill bar at top — reads as % visually */}
      <View
        style={{
          position: "absolute",
          left: 3,
          right: 3,
          top: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: idle ? t.textFaint : "#fff",
          opacity: 0.85,
          width: `${Math.max(0, (server.util / 100) * 100)}%`,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 3,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 9,
              fontWeight: "700",
              color: idle ? t.textSoft : "#fff",
              letterSpacing: 0,
            },
          ]}
        >
          {idle ? "—" : server.util}
        </Text>
      </View>
    </View>
  );
}

export function GpuHeatmap(): React.ReactElement {
  const t = useTheme();
  const rows: typeof MOCK_COMPUTE.servers[] = [];
  for (let i = 0; i < MOCK_COMPUTE.servers.length; i += COLS) {
    rows.push(MOCK_COMPUTE.servers.slice(i, i + COLS));
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
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", gap: CELL_GAP }}>
          {row.map((server) => (
            <Cell key={server.id} server={server} />
          ))}
        </View>
      ))}
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 9,
            color: t.textSoft,
            marginTop: SPACE[1],
            letterSpacing: 0.1,
            textTransform: "uppercase",
          },
        ]}
      >
        {MOCK_COMPUTE.servers.length} servers · util %
      </Text>
    </View>
  );
}
