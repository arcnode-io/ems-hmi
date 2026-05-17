/**
 * Mock data for the Energy screen — replaced once useEnergyHistory +
 * useDispatchState + useMarkets land (see [[useEnergyHistory]] in step 9b).
 * Mirrors the designer's energy-detail-screen.jsx fixture so the visual
 * port can be eye-checked against the mock.
 */

export interface MarketRow {
  id: string;
  name: string;
  product: "Energy" | "Ancillary" | "Capacity";
  status: "CLEARED" | "PENDING" | "ACTIVE";
  mwh: number | null;
  dollars: number | null;
  next: string;
}

export const MOCK_ENERGY = {
  revToday: {
    arbitrage: 4280,
    ancillary: 1840,
    capacity: 640,
    total: 6760,
    target: 8200,
  },
  dispatch: {
    action: "DISCHARGE BESS",
    reason: "Arbitrage spread $187/MWh",
    intervalSecLeft: 142,
    confidence: 0.94,
    bessSocPct: 73,
  },
  markets: [
    { id: "CAISO-DA", name: "CAISO Day-Ahead", product: "Energy", status: "CLEARED", mwh: 8.2, dollars: 187, next: "12:00" },
    { id: "CAISO-RT", name: "CAISO Real-Time", product: "Energy", status: "CLEARED", mwh: 1.4, dollars: 213, next: "NOW" },
    { id: "CAISO-AS-RR", name: "Reg Up", product: "Ancillary", status: "CLEARED", mwh: 2.0, dollars: 18, next: "14:30" },
    { id: "CAISO-AS-SR", name: "Spinning Reserve", product: "Ancillary", status: "PENDING", mwh: 1.5, dollars: null, next: "15:00" },
    { id: "RA", name: "Resource Adequacy", product: "Capacity", status: "ACTIVE", mwh: null, dollars: 640, next: "EOD" },
  ] as MarketRow[],
  /** [minutesFromNow, pvForecastKw, priceUsdPerMwh, plannedBessKw] */
  forecast: [
    [0, 2840, 187, 1620],
    [5, 2880, 192, 1700],
    [10, 2900, 198, 1750],
    [15, 2920, 203, 1800],
    [20, 2940, 211, 1850],
    [25, 2950, 218, 1900],
    [30, 2940, 224, 1950],
    [35, 2920, 229, 1900],
    [40, 2890, 226, 1820],
    [45, 2840, 218, 1700],
    [50, 2780, 205, 1500],
    [55, 2700, 188, 1200],
  ] as Array<[number, number, number, number]>,
  forecastNote: "Peak price window 13:25–13:55 · BESS holds discharge",
};
