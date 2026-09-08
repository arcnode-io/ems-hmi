/**
 * Mock data for the Energy screen — ERCOT HB_NORTH, single-node.
 *
 * The price + planned-dispatch forecast is the canonical
 * `DISPATCH_FORECAST` (also drives the DecisionRecord); the PV overlay is
 * Energy-screen-local. Markets + revenue are still mocked — real wiring
 * tracked in step 9b.
 */

import {
  DISPATCH_FORECAST,
  MARKET_ASSUMPTIONS,
} from "../../../../data/dispatch/dispatchForecast";

export interface MarketRow {
  id: string;
  name: string;
  product: "Energy" | "Ancillary";
  status: "CLEARED" | "PENDING" | "ACTIVE";
  mwh: number | null;
  dollars: number | null;
  next: string;
}

/** PV output forecast, kW, aligned 1:1 with DISPATCH_FORECAST steps. */
const PV_FORECAST_KW: readonly number[] = [
  2840, 2880, 2900, 2920, 2940, 2950, 2940, 2920, 2890, 2840, 2780, 2700,
];

export const MOCK_ENERGY = {
  revToday: {
    arbitrage: 4280,
    ancillary: 1840,
    capacity: 640,
    total: 6760,
    target: 8200,
  },
  markets: [
    {
      id: "ERCOT-DAM",
      name: `ERCOT DAM · ${MARKET_ASSUMPTIONS.settlementPoint}`,
      product: "Energy",
      status: "CLEARED",
      mwh: 8.2,
      dollars: 78,
      next: "T-2h",
    },
    {
      id: "ERCOT-RT",
      name: `ERCOT RT SPP · ${MARKET_ASSUMPTIONS.settlementPoint}`,
      product: "Energy",
      status: "CLEARED",
      mwh: 1.4,
      dollars: 104,
      next: "NOW",
    },
    {
      id: "ERCOT-RRS",
      name: "Responsive Reserve (RRS)",
      product: "Ancillary",
      status: "CLEARED",
      mwh: 2.0,
      dollars: 14,
      next: "T+45m",
    },
    {
      id: "ERCOT-ECRS",
      name: "Contingency Reserve (ECRS)",
      product: "Ancillary",
      status: "PENDING",
      mwh: 1.5,
      dollars: null,
      next: "T+1h",
    },
    {
      id: "ERCOT-REGUP",
      name: "Reg-Up",
      product: "Ancillary",
      status: "CLEARED",
      mwh: 1.0,
      dollars: 9,
      next: "T+15m",
    },
  ] as MarketRow[],
  /** [minutesFromNow, pvForecastKw, priceUsdPerMwh, plannedBessKw] */
  forecast: DISPATCH_FORECAST.map(
    (p, i) =>
      [p.minFromNow, PV_FORECAST_KW[i], p.priceUsdPerMwh, p.plannedBessKw] as [
        number,
        number,
        number,
        number,
      ],
  ),
  forecastNote:
    "DAM peak $104/MWh in the T+20–35 min window — BESS holds discharge through it",
};
