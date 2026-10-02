/** PueTile — Overview KPI tile. Static until a PUE timeseries lands. */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { KpiSpark } from "./KpiSpark";
import { cardStyle } from "./kpiCard";

export function PueTile(): React.ReactElement {
  const t = useTheme();
  return (
    <View style={cardStyle(t)}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          PUE · 24h
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.textSoft, fontWeight: "600" },
          ]}
        >
          ‹ 1.20
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
          marginTop: SPACE[3],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { color: t.text, fontSize: 26, letterSpacing: -0.5 },
          ]}
        >
          1.14
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.statusOk, marginLeft: 4 },
          ]}
        >
          ↓ 0.03
        </Text>
      </View>
      <View style={{ marginTop: SPACE[2] }}>
        <KpiSpark
          color={t.colorThermal}
          points={[1.18, 1.17, 1.19, 1.16, 1.15, 1.16, 1.14, 1.13, 1.14, 1.15, 1.14, 1.13, 1.14]}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textMid, marginTop: SPACE[2] },
        ]}
      >
        24h · liquid-cooled
      </Text>
    </View>
  );
}
