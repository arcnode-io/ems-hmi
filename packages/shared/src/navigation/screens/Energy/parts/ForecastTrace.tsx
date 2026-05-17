/**
 * ForecastTrace — 60-min forward look at price + planned BESS dispatch.
 * Uses canonical TimeseriesChart with two series:
 *   - price (solid, colorGrid) — $/MWh
 *   - planned BESS kW (dashed, colorBess) — operator intent
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { TimeseriesChart, type TimeseriesSeries } from "../../../../components/composed/TimeseriesChart/TimeseriesChart";
import { MOCK_ENERGY } from "../data/mockEnergy";

export function ForecastTrace(): React.ReactElement {
  const t = useTheme();
  const priceSeries: TimeseriesSeries = {
    label: "Price ($/MWh)",
    color: t.colorGrid,
    points: MOCK_ENERGY.forecast.map(([min, , price]) => ({ x: min, y: price })),
  };
  const bessSeries: TimeseriesSeries = {
    label: "Planned BESS (kW)",
    color: t.colorBess,
    style: "dashed",
    points: MOCK_ENERGY.forecast.map(([min, , , bess]) => ({ x: min, y: bess })),
  };

  return (
    <View style={{ marginHorizontal: SPACE[4], gap: SPACE[2] }}>
      <TimeseriesChart
        title="Forecast — next 60 min"
        xAxis={{ label: "min from now", kind: "numeric" }}
        yAxis={{ label: "price / dispatch", unit: "mixed" }}
        series={[priceSeries, bessSeries]}
        height={180}
      />
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textSoft, marginTop: 2 },
        ]}
      >
        {MOCK_ENERGY.forecastNote}
      </Text>
    </View>
  );
}
