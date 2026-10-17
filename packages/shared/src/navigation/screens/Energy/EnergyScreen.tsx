/**
 * EnergyScreen — `/energy` route. Markets, revenue and forecast come from the
 * site's market enrollment; the DTM carries none yet, so the screen says so
 * instead of showing anything (constitution §3.4 — no canned values).
 */

import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { EDPanel } from "./parts/EDPanel";

export function EnergyScreen(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  return (
    <ScrollView
      dataSet={{ comp: "EnergyScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[5] }}
    >
      {/* Header strip: title + Live indicator */}
      <View
        style={{
          marginTop: SPACE[3],
          marginHorizontal: SPACE[4],
          marginBottom: SPACE[2],
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: SPACE[2],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[
              resolveTypeStyle(t, "screenTitle"),
              {
                fontSize: 22,
                color: t.text,
                lineHeight: 22,
                letterSpacing: isSov ? 0.5 : 0,
                ...(isSov ? { textTransform: "uppercase" } : null),
              },
            ]}
          >
            {isSov ? "ENERGY" : "Energy"}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                letterSpacing: 0.2,
                color: t.textSoft,
                textTransform: "uppercase",
                marginTop: 2,
              },
            ]}
          >
            Markets · revenue
          </Text>
        </View>
      </View>

      <View style={{ marginHorizontal: SPACE[4] }}>
        <EDPanel>
          <Text style={[resolveTypeStyle(t, "cardHeading"), { color: t.text }]}>No market connected</Text>
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid, marginTop: SPACE[2] }]}>
            This site isn&apos;t enrolled in a market. Prices, revenue and planned dispatch show here once it is.
          </Text>
        </EDPanel>
      </View>
    </ScrollView>
  );
}
