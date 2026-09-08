/**
 * Autopilot — the demo's standing dispatch suggestion. In a real deployment
 * this is the EMS optimizer's output; here it's a SoC-aware arbitrage rule:
 * discharge into the peak when the pack is full enough, charge at the trough
 * when it's low. The lifecycle's fixed ±30-point SoC swing then oscillates
 * the pack between roughly 30% and 60% — never near the 20% reserve floor.
 */

import type { DispatchProposal } from "./dispatch.types";
import { MARKET_ASSUMPTIONS } from "./dispatchForecast";

/** The demo's single dispatchable BESS — used where no device context exists. */
export const DEMO_DISPATCH_DEVICE_ID = "bess_module_01";

/** Discharge/charge magnitude, kW. */
const SETPOINT_KW = 1620;
/** Blended DAM+RTM clearing price for a discharge, USD/MWh. */
const DISCHARGE_PRICE_USD_PER_MWH = 78;
/** Off-peak trough price for a charge, USD/MWh (below the charge-cost floor). */
const CHARGE_PRICE_USD_PER_MWH = 19;

/** At or above this SoC the autopilot discharges; below it, it charges. */
export const AUTOPILOT_SOC_PIVOT_PCT = 50;

const SPREAD =
  DISCHARGE_PRICE_USD_PER_MWH - MARKET_ASSUMPTIONS.chargeFloorUsdPerMwh;
const DISCHARGE_REASON = `Peak-price arbitrage · $${SPREAD}/MWh spread`;
const CHARGE_REASON = `Charging the trough at $${CHARGE_PRICE_USD_PER_MWH}/MWh · banking for the peak`;

/** True when the pack is low enough that the autopilot should charge, not discharge. */
export function shouldAutopilotCharge(socPct: number): boolean {
  return socPct < AUTOPILOT_SOC_PIVOT_PCT;
}

/**
 * The autopilot's standing proposal for a BESS device at the current SoC.
 * @param deviceId Target device.
 * @param socPct Pack state of charge, percent. Defaults to a nominal 60
 *   (discharge) for display contexts that have no live reading yet.
 */
export function autopilotProposal(
  deviceId: string,
  socPct = 60,
): DispatchProposal {
  if (shouldAutopilotCharge(socPct)) {
    return {
      deviceId,
      setpointKw: -SETPOINT_KW,
      priceUsdPerMwh: CHARGE_PRICE_USD_PER_MWH,
      reason: CHARGE_REASON,
    };
  }
  return {
    deviceId,
    setpointKw: SETPOINT_KW,
    priceUsdPerMwh: DISCHARGE_PRICE_USD_PER_MWH,
    reason: DISCHARGE_REASON,
  };
}

/**
 * How long the lifecycle rests in `proposed` before autopilot re-fires the
 * standing proposal — a visible "standing by" beat, not instant re-arm.
 */
export const AUTOPILOT_REARM_MS = 2500;

/**
 * Whether autopilot should confirm the standing proposal now.
 * @param restingSinceMs performance.now() the lifecycle entered `proposed`, or null.
 * @param now current performance.now().
 */
export function shouldRearm(
  restingSinceMs: number | null,
  now: number,
): boolean {
  return restingSinceMs !== null && now - restingSinceMs >= AUTOPILOT_REARM_MS;
}
