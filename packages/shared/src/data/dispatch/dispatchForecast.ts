/**
 * Demo dispatch forecast — the price + planned-BESS curve the autopilot
 * bids against, plus the ERCOT HB_NORTH market assumptions for one
 * arbitrage cycle. Single source: the Energy screen's ForecastTrace and
 * the DecisionRecord both read this.
 *
 * Prices are ERCOT HB_NORTH DAM-plausible ($/MWh): an overnight charge
 * trough then a midday discharge peak. `plannedBessKw` is the optimizer's
 * intent — positive = discharge into the grid.
 *
 * Demo-only. Real deployments get this from ems-analyst-model's forecast
 * curve + the EMS optimizer.
 */

/** One forecast step: minutes ahead, price, and the optimizer's planned setpoint. */
export interface DispatchForecastPoint {
  /** Minutes from now. */
  minFromNow: number;
  /** DAM clearing price forecast at this step, $/MWh. */
  priceUsdPerMwh: number;
  /** Optimizer's planned BESS setpoint, kW. Positive = discharge. */
  plannedBessKw: number;
}

/** Next 60 min, 5-min steps — price climbs into a peak around T+30, then eases. */
export const DISPATCH_FORECAST: readonly DispatchForecastPoint[] = [
  { minFromNow: 0, priceUsdPerMwh: 58, plannedBessKw: 1420 },
  { minFromNow: 5, priceUsdPerMwh: 64, plannedBessKw: 1520 },
  { minFromNow: 10, priceUsdPerMwh: 72, plannedBessKw: 1650 },
  { minFromNow: 15, priceUsdPerMwh: 83, plannedBessKw: 1760 },
  { minFromNow: 20, priceUsdPerMwh: 94, plannedBessKw: 1850 },
  { minFromNow: 25, priceUsdPerMwh: 101, plannedBessKw: 1920 },
  { minFromNow: 30, priceUsdPerMwh: 104, plannedBessKw: 1950 },
  { minFromNow: 35, priceUsdPerMwh: 99, plannedBessKw: 1900 },
  { minFromNow: 40, priceUsdPerMwh: 90, plannedBessKw: 1780 },
  { minFromNow: 45, priceUsdPerMwh: 81, plannedBessKw: 1600 },
  { minFromNow: 50, priceUsdPerMwh: 76, plannedBessKw: 1440 },
  { minFromNow: 55, priceUsdPerMwh: 74, plannedBessKw: 1300 },
] as const;

/** ERCOT HB_NORTH assumptions for the demo arbitrage cycle. */
export const MARKET_ASSUMPTIONS = {
  wholesaleMarket: "ERCOT",
  settlementPoint: "HB_NORTH",
  /** Off-peak price this cycle charged the pack at, $/MWh. */
  chargeFloorUsdPerMwh: 24,
  /** SoC the optimizer holds as reserve — never discharges below this, %. */
  socFloorPct: 20,
} as const;
