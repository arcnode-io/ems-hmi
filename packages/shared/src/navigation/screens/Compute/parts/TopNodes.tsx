/**
 * TopNodes — top 5 gpu_nodes by draw, with % of GPU cap in use. Read-only.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GpuFleet } from "../../../../data/compute/useGpuFleet";
import { topNodes } from "./computeView";

const TOP_N = 5;

export function TopNodes({ fleet }: { fleet: GpuFleet }): React.ReactElement {
  const t = useTheme();
  const ranked = topNodes(fleet, TOP_N);
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[2],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      {ranked.map((row, idx) => (
        <View
          key={row.deviceId}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: SPACE[2],
            paddingHorizontal: SPACE[3],
            borderTopWidth: idx > 0 ? 1 : 0,
            borderTopColor: t.borderSoft,
            gap: SPACE[3],
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                fontWeight: "700",
                color: t.textSoft,
                letterSpacing: 0.15,
                textTransform: "uppercase",
                width: 20,
              },
            ]}
          >
            {idx + 1}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 12,
                fontWeight: "600",
                color: t.text,
                letterSpacing: 0.05,
                flex: 1,
              },
            ]}
          >
            {row.deviceId.toUpperCase()}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 12, color: t.colorCompute, fontWeight: "700" },
            ]}
          >
            {row.cap}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 10, color: t.textMid, width: 64, textAlign: "right" },
            ]}
          >
            {row.draw}
          </Text>
        </View>
      ))}
    </View>
  );
}
