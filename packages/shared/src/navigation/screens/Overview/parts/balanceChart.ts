/** Power-balance chart props from the live/history series (W → kW). */

import type { PowerBalance } from "../../../../data/history/usePowerBalance";
import type { TimePoint } from "../../../../data/history/powerBalance";
import type { TimeseriesSeries } from "../../../../components/composed/TimeseriesChart/TimeseriesChart.types";

export interface BalanceColors {
  grid: string;
  bess: string;
  gpu: string;
}

const toKw = (points: readonly TimePoint[]): TimePoint[] =>
  points.map((point) => ({ x: point.x, y: point.y === null ? null : point.y / 1000 }));

/** @example balanceChart(balance, colors).series[0].label // "Grid import" */
export function balanceChart(
  balance: PowerBalance,
  colors: BalanceColors,
): { title: string; series: TimeseriesSeries[] } {
  const { grid, bess, gpu } = balance.series;
  return {
    title: `Power balance · ${balance.hasHistory ? "last 15 min" : "since page load"}`,
    series: [
      { label: "Grid import", color: colors.grid, points: toKw(grid) },
      { label: "Battery discharge", color: colors.bess, points: toKw(bess) },
      { label: "GPU draw", color: colors.gpu, points: toKw(gpu) },
    ],
  };
}
