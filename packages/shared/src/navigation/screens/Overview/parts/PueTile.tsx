/**
 * PueTile — Overview KPI tile. No site PUE source is wired yet, so it reads
 * unknown ("—"), never a placeholder number (constitution §3.4).
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { cardStyle } from "./kpiCard";

export function PueTile(): React.ReactElement {
  const t = useTheme();
  return (
    <View style={cardStyle(t)}>
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>PUE</Text>
      <Text
        style={[
          resolveTypeStyle(t, "kpiValue"),
          { color: t.textMid, fontSize: 26, letterSpacing: -0.5, marginTop: SPACE[3] },
        ]}
      >
        —
      </Text>
      <Text
        numberOfLines={1}
        style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid, marginTop: SPACE[2] }]}
      >
        No PUE reading yet
      </Text>
    </View>
  );
}
