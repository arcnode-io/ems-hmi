/**
 * buildDecisionRecord — a deterministic "why this action" explanation for
 * a BESS dispatch. Pure: every field is a function of the autopilot
 * proposal, the live SoC, and the demo forecast. The LLM analyst narrates
 * the outcome; this states the plan, in numbers, with no model in the loop.
 *
 * Demo-only. A real EMS emits this straight from the optimizer's objective.
 */

import type { DispatchProposal } from "./dispatch.types";
import {
  DISPATCH_FORECAST,
  MARKET_ASSUMPTIONS,
  type DispatchForecastPoint,
} from "./dispatchForecast";
import { SETTLE_WINDOW_HOURS, MAX_SETPOINT_KW } from "./constants";

export type DispatchAction = "Discharge" | "Charge" | "Hold";

export interface PeakWindow {
  /** Minutes from now the high-price span opens. */
  startMin: number;
  /** Minutes from now it closes. */
  endMin: number;
  /** The single highest price in the forecast, $/MWh. */
  peakPriceUsdPerMwh: number;
}

export interface DecisionRecord {
  action: DispatchAction;
  /** Signed setpoint, kW. Positive = discharge. */
  setpointKw: number;
  window: PeakWindow;
  /** Human window label, e.g. "T+15–25 min". */
  windowLabel: string;
  /** Price the action is bid at, $/MWh. */
  clearingPriceUsdPerMwh: number;
  /** Off-peak price the pack charged at, $/MWh. */
  chargeFloorUsdPerMwh: number;
  /**
   * Round-trip spread, $/MWh — realized (discharge: clearing − charge cost)
   * or expected (charge: forecast peak − charge price).
   */
  spreadUsdPerMwh: number;
  socPct: number;
  socFloorPct: number;
  /** socPct − socFloorPct, percentage points. */
  socHeadroomPct: number;
  /** Module power rating magnitude, kW. */
  powerLimitKw: number;
  /** Energy moved over the dispatch window, MWh. */
  energyMwh: number;
  /** Gross revenue at the clearing price now, USD (0 for a charge). */
  grossRevenueUsd: number;
  /** Realized (discharge) or expected-at-peak (charge) profit, USD. */
  netProfitUsd: number;
  /** One-line takeaway. */
  rationale: string;
  /** Cited "because" bullets, one number each. */
  drivers: string[];
}

interface BuildOpts {
  forecast: readonly DispatchForecastPoint[];
  chargeFloorUsdPerMwh: number;
  socFloorPct: number;
  powerLimitKw: number;
  /** Hours the dispatch window represents (sim-compressed). */
  windowHours: number;
}

const DEFAULTS: BuildOpts = {
  forecast: DISPATCH_FORECAST,
  chargeFloorUsdPerMwh: MARKET_ASSUMPTIONS.chargeFloorUsdPerMwh,
  socFloorPct: MARKET_ASSUMPTIONS.socFloorPct,
  powerLimitKw: MAX_SETPOINT_KW,
  windowHours: SETTLE_WINDOW_HOURS,
};

/** Fraction of the trough→peak range a step must clear to count as "peak". */
const PEAK_BAND = 0.7;

/**
 * The contiguous high-price span around the forecast's single peak.
 * "High" = at or above `trough + PEAK_BAND · (peak − trough)`.
 * @throws if the forecast is empty.
 */
export function peakPriceWindow(
  forecast: readonly DispatchForecastPoint[],
): PeakWindow {
  const peakEntry = forecast.reduce((a, b) =>
    b.priceUsdPerMwh > a.priceUsdPerMwh ? b : a,
  );
  const trough = Math.min(...forecast.map((p) => p.priceUsdPerMwh));
  const threshold = trough + (peakEntry.priceUsdPerMwh - trough) * PEAK_BAND;
  const peakIdx = forecast.indexOf(peakEntry);

  let loEntry = peakEntry;
  for (let i = peakIdx - 1; i >= 0; i -= 1) {
    const e = forecast[i];
    if (!e || e.priceUsdPerMwh < threshold) break;
    loEntry = e;
  }
  let hiEntry = peakEntry;
  for (let i = peakIdx + 1; i < forecast.length; i += 1) {
    const e = forecast[i];
    if (!e || e.priceUsdPerMwh < threshold) break;
    hiEntry = e;
  }

  return {
    startMin: loEntry.minFromNow,
    endMin: hiEntry.minFromNow,
    peakPriceUsdPerMwh: peakEntry.priceUsdPerMwh,
  };
}

function actionOf(setpointKw: number): DispatchAction {
  if (setpointKw > 0) return "Discharge";
  if (setpointKw < 0) return "Charge";
  return "Hold";
}

function dischargeDrivers(r: DecisionRecord): string[] {
  return [
    `Price $${r.clearingPriceUsdPerMwh}/MWh clears $${r.spreadUsdPerMwh} above the $${r.chargeFloorUsdPerMwh}/MWh overnight charge cost`,
    `Forecast peaks ${r.windowLabel} at $${r.window.peakPriceUsdPerMwh}/MWh`,
    `SoC ${r.socPct}% leaves ${r.socHeadroomPct} pts over the ${r.socFloorPct}% reserve floor — covers the ${r.energyMwh.toFixed(1)} MWh`,
    `Setpoint ${r.setpointKw} kW within the ±${r.powerLimitKw} kW module rating`,
  ];
}

function chargeDrivers(r: DecisionRecord): string[] {
  return [
    `Charging at $${r.clearingPriceUsdPerMwh}/MWh — a trough well under the $${r.chargeFloorUsdPerMwh}/MWh weekly charge cost`,
    `Forecast peaks ${r.windowLabel} at $${r.window.peakPriceUsdPerMwh}/MWh → $${r.spreadUsdPerMwh}/MWh round-trip if sold there`,
    `SoC ${r.socPct}% has room to bank the ${r.energyMwh.toFixed(1)} MWh`,
    `Setpoint ${r.setpointKw} kW within the ±${r.powerLimitKw} kW module rating`,
  ];
}

/**
 * Build the decision record for a proposal against the current SoC.
 * @param proposal The autopilot's standing proposal (or an operator override).
 * @param socPct Pack state of charge at decision time, percent.
 * @param opts Forecast + market assumptions; defaults to the demo values.
 */
export function buildDecisionRecord(
  proposal: DispatchProposal,
  socPct: number,
  opts: Partial<BuildOpts> = {},
): DecisionRecord {
  const o: BuildOpts = { ...DEFAULTS, ...opts };
  const action = actionOf(proposal.setpointKw);
  const window = peakPriceWindow(o.forecast);
  const windowLabel = `T+${window.startMin}–${window.endMin} min`;
  // Discharge → realized spread (sold now vs. what it cost to fill).
  // Charge → expected spread (bought now vs. the forecast peak it'll sell into).
  const spreadUsdPerMwh =
    action === "Charge"
      ? window.peakPriceUsdPerMwh - proposal.priceUsdPerMwh
      : proposal.priceUsdPerMwh - o.chargeFloorUsdPerMwh;
  const socHeadroomPct = Math.round(socPct - o.socFloorPct);
  const energyMwh = (Math.abs(proposal.setpointKw) / 1000) * o.windowHours;
  const grossRevenueUsd =
    action === "Discharge" ? energyMwh * proposal.priceUsdPerMwh : 0;
  const netProfitUsd = action === "Hold" ? 0 : energyMwh * spreadUsdPerMwh;

  const base: DecisionRecord = {
    action,
    setpointKw: proposal.setpointKw,
    window,
    windowLabel,
    clearingPriceUsdPerMwh: proposal.priceUsdPerMwh,
    chargeFloorUsdPerMwh: o.chargeFloorUsdPerMwh,
    spreadUsdPerMwh,
    socPct: Math.round(socPct),
    socFloorPct: o.socFloorPct,
    socHeadroomPct,
    powerLimitKw: o.powerLimitKw,
    energyMwh,
    grossRevenueUsd,
    netProfitUsd,
    rationale: "",
    drivers: [],
  };

  if (action === "Hold") {
    return {
      ...base,
      rationale: "Holding — no price spread worth cycling the pack for.",
      drivers: [`Price $${proposal.priceUsdPerMwh}/MWh near the charge floor`],
    };
  }
  if (action === "Charge") {
    return {
      ...base,
      rationale: `Charge ${Math.abs(proposal.setpointKw)} kW at $${proposal.priceUsdPerMwh}/MWh — banking ${energyMwh.toFixed(1)} MWh for the ${windowLabel} $${window.peakPriceUsdPerMwh}/MWh peak (~$${Math.round(netProfitUsd)} expected).`,
      drivers: chargeDrivers(base),
    };
  }
  return {
    ...base,
    rationale: `Discharge ${proposal.setpointKw} kW into the ${windowLabel} price peak — $${spreadUsdPerMwh}/MWh over charge cost, ~$${Math.round(netProfitUsd)} net.`,
    drivers: dischargeDrivers(base),
  };
}
