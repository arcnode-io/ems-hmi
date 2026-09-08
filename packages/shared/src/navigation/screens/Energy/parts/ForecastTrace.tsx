/**
 * ForecastTrace — 60-min forward look at the optimizer's planned BESS
 * setpoint. Single series (kW, + = discharge) on the canonical
 * TimeseriesChart.
 *
 * Price isn't plotted here — it lives on a different scale ($/MWh vs kW)
 * and the peak-window context is in the caption + the Decision Record.
 * A proper dual-axis overlay is a post-demo change (see
 * /tmp/HANDOFF-dual-axis-linespec-2026-09-07.md).
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import {
  TimeseriesChart,
  type TimeseriesSeries,
} from "../../../../components/composed/TimeseriesChart/TimeseriesChart";
import { MOCK_ENERGY } from "../data/mockEnergy";

export function ForecastTrace(): React.ReactElement {
  const t = useTheme();

  const bessSeries: TimeseriesSeries = {
    label: "Planned BESS (kW)",
    color: t.colorBess,
    points: MOCK_ENERGY.forecast.map(([min, , , bess]) => ({
      x: min,
      y: bess,
    })),
  };

  return (
    <View style={{ marginHorizontal: SPACE[4], gap: SPACE[2] }}>
      <TimeseriesChart
        title="Planned dispatch — next 60 min"
        xAxis={{ label: "min from now", kind: "numeric" }}
        yAxis={{ label: "Planned setpoint", unit: "kW" }}
        series={[bessSeries]}
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
