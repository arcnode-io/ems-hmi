/**
 * TopServers — top 5 servers by utilization. Pure read-only table.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { MOCK_COMPUTE } from "../data/mockCompute";

const TOP_N = 5;

export function TopServers(): React.ReactElement {
  const t = useTheme();
  const ranked = [...MOCK_COMPUTE.servers]
    .sort((a, b) => b.util - a.util)
    .slice(0, TOP_N);
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
      {ranked.map((s, i) => (
        <View
          key={s.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: SPACE[2],
            paddingHorizontal: SPACE[3],
            borderTopWidth: i > 0 ? 1 : 0,
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
            {i + 1}
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
            COMPUTE-{s.id.toUpperCase()}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 12, color: t.colorCompute, fontWeight: "700" },
            ]}
          >
            {s.util}%
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 10, color: t.textMid, width: 64, textAlign: "right" },
            ]}
          >
            {s.draw} W
          </Text>
        </View>
      ))}
    </View>
  );
}
