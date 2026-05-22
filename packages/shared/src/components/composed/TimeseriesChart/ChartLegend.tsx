/** ChartLegend — series swatches + an optional "as of …" timestamp. */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { seriesColor } from "../ChartRenderer/helpers";
import type { TimeseriesSeries } from "./TimeseriesChart.types";

export interface ChartLegendProps {
  series: readonly TimeseriesSeries[];
  dataAsOf?: string;
}

export function ChartLegend({
  series,
  dataAsOf,
}: ChartLegendProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {series.map((s, i) => (
          <View
            key={`legend-${i}`}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 10,
                height: 2,
                backgroundColor: s.color ?? seriesColor(t, i),
                opacity: s.style === "dashed" ? 0.65 : 1,
              }}
            />
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                { color: t.textMid, fontSize: 9 },
              ]}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      {dataAsOf ? (
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            { color: t.textSoft, fontSize: 9 },
          ]}
        >
          as of {dataAsOf}
        </Text>
      ) : null}
    </View>
  );
}
