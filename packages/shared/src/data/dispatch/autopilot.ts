/**
 * Autopilot — the demo's standing dispatch suggestion. In a real deployment
 * this is the EMS optimizer's output; here it is a fixed arbitrage proposal
 * so the operator always has something concrete to confirm.
 */

import type { DispatchProposal } from "./dispatch.types";

/** The demo's single dispatchable BESS — used where no device context exists. */
export const DEMO_DISPATCH_DEVICE_ID = "bess_module_01";

/** Proposed discharge rate, kW. Positive = discharge into the grid. */
const PROPOSED_SETPOINT_KW = 1620;
/** Market price driving the proposal, USD/MWh. */
const PROPOSED_PRICE_USD_PER_MWH = 187;
const PROPOSED_REASON = "Arbitrage spread $187/MWh";

/** The autopilot's standing proposal for a given BESS device. */
export function autopilotProposal(deviceId: string): DispatchProposal {
  return {
    deviceId,
    setpointKw: PROPOSED_SETPOINT_KW,
    priceUsdPerMwh: PROPOSED_PRICE_USD_PER_MWH,
    reason: PROPOSED_REASON,
  };
}
