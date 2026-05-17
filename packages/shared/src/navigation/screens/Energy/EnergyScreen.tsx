/**
 * EnergyScreen — `/energy` route. Dispatch + markets + 60-min forecast.
 * Composition: header + (warning?) + MoneyStrip + flow diagram +
 * ActiveDispatchPanel + ForecastTrace + MarketsList.
 *
 * Most data still mocked (revenue, markets, forecast, dispatch). Wiring
 * to live hooks tracked in step 9b.
 */

import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { EDSectionHead } from "./parts/EDPanel";
import { MoneyStrip } from "./parts/MoneyStrip";
import { ActiveDispatchPanel } from "./parts/ActiveDispatchPanel";
import { EnergyFlowDiagram } from "./parts/EnergyFlowDiagram";
import { ForecastTrace } from "./parts/ForecastTrace";
import { MarketsList } from "./parts/MarketsList";

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
            Dispatch · Markets · 5-min settlement
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: t.statusOk,
              }}
            />
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                {
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 0.18,
                  color: t.statusOk,
                  textTransform: "uppercase",
                },
              ]}
            >
              Live
            </Text>
          </View>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 9, color: t.textSoft, marginTop: 2 },
            ]}
          >
            1s ago
          </Text>
        </View>
      </View>

      <MoneyStrip />

      <EDSectionHead title="Flow" meta="kW · live" />
      <EnergyFlowDiagram />

      <EDSectionHead title="Active dispatch" meta="autopilot" />
      <ActiveDispatchPanel />

      <EDSectionHead title="Forecast" meta="next 60 min" />
      <ForecastTrace />

      <EDSectionHead title="Markets" />
      <MarketsList />
    </ScrollView>
  );
}
