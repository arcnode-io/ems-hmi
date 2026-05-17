/**
 * ForecastTrace — 60-min forward look at price + planned BESS dispatch.
 * Uses canonical TimeseriesChart with two series:
 *   - price (solid, colorGrid) — $/MWh
 *   - planned BESS kW (dashed, colorBess) — operator intent
 *
 * Per UTILITY-FEEDS §4, the active DOE import/export limits render as
 * horizontal `alarm`-severity threshold lines so operators see the
 * envelope ceiling the planned dispatch must respect.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import {
  TimeseriesChart,
  type TimeseriesSeries,
  type TimeseriesThreshold,
} from "../../../../components/composed/TimeseriesChart/TimeseriesChart";
import { useOperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";
import { MOCK_ENERGY } from "../data/mockEnergy";

export function ForecastTrace(): React.ReactElement {
  const t = useTheme();
  const envelope = useOperatingEnvelope();

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

  // Reason: DOE limits arrive as kW from useOperatingEnvelope. exportLimitKw
  // is already signed-positive (the magnitude); negate it so the line lands
  // on the export side of the y-axis. ISLAND returns null → no lines.
  const thresholds: TimeseriesThreshold[] = [];
  if (envelope.importLimitKw !== null) {
    thresholds.push({
      label: `DOE IMP LIMIT ${envelope.importLimitKw.toFixed(0)} kW`,
      y: envelope.importLimitKw,
      severity: "alarm",
    });
  }
  if (envelope.exportLimitKw !== null && envelope.exportLimitKw > 0) {
    thresholds.push({
      label: `DOE EXP LIMIT ${envelope.exportLimitKw.toFixed(0)} kW`,
      y: -envelope.exportLimitKw,
      severity: "alarm",
    });
  }

  return (
    <View style={{ marginHorizontal: SPACE[4], gap: SPACE[2] }}>
      <TimeseriesChart
        title="Forecast — next 60 min"
        xAxis={{ label: "min from now", kind: "numeric" }}
        yAxis={{ label: "price / dispatch", unit: "mixed" }}
        series={[priceSeries, bessSeries]}
        thresholds={thresholds}
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
