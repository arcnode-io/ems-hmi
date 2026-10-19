/**
 * EnergyScreen — `/energy` route. The day-ahead price forecast for the
 * site's settlement point, from analyst `/forecast`. Revenue and planned
 * dispatch have no source yet, so they aren't shown (constitution §3.4 — no
 * canned values).
 */

import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { useForecast } from "../../../data/forecast/useForecast";
import type { FetchFn } from "../../../data/history/measurementsApi";
import { PricePanel } from "./parts/PricePanel";

export function EnergyScreen({ fetchFn }: { fetchFn?: FetchFn }): React.ReactElement {
  const t = useTheme();
  const prices = useForecast(fetchFn);
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
            Market prices
          </Text>
        </View>
      </View>

      <PricePanel state={prices} />
    </ScrollView>
  );
}
