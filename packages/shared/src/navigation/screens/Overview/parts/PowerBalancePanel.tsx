/**
 * PowerBalancePanel — Overview's story chart: grid import at the POI,
 * battery discharge, compute draw over time. During a curtailment the grid
 * line drops, the battery line rises to meet it, and compute draw stays flat.
 * Replaces the mock 24h EnergyChart.
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { SPACE } from "../../../../theme/tokens/primitives";
import { TimeseriesChart } from "../../../../components/composed/TimeseriesChart/TimeseriesChart";
import type { PowerBalance } from "../../../../data/history/usePowerBalance";
import { balanceChart } from "./balanceChart";

export function PowerBalancePanel({ balance }: { balance: PowerBalance }): React.ReactElement {
  const t = useTheme();
  const chart = balanceChart(balance, { grid: t.colorGrid, bess: t.colorBess, compute: t.colorCompute });
  return (
    <View dataSet={{ comp: "PowerBalancePanel" }} style={{ marginHorizontal: SPACE[4], marginTop: SPACE[3] }}>
      <TimeseriesChart
        title={chart.title}
        xAxis={{ label: "Time", kind: "time" }}
        yAxis={{ label: "Power", unit: "kW" }}
        series={chart.series}
      />
    </View>
  );
}
