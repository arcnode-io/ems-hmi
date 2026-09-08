/**
 * useAutopilotProposal — the autopilot's standing proposal for a device,
 * recomputed as the pack's live SoC crosses the discharge/charge pivot.
 * One place that subscribes SoC so CommandPanel / ActiveDispatchPanel /
 * DecisionRecord all show the same standing action.
 */

import { useSubscription } from "../mqtt/useSubscription";
import { measurementTopic } from "../topics/topicBuilder";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { autopilotProposal } from "./autopilot";
import type { DispatchProposal } from "./dispatch.types";

/** SoC fallback before the first measurement lands, percent. */
const NOMINAL_SOC = 60;

/** @returns the SoC-aware autopilot proposal for `deviceId`. */
export function useAutopilotProposal(deviceId: string): DispatchProposal {
  const identity = useDeploymentIdentity();
  const socMsg = useSubscription<number>(
    measurementTopic(identity.siteId, deviceId, "state_of_charge", "percent"),
  );
  const socPct = typeof socMsg?.value === "number" ? socMsg.value : NOMINAL_SOC;
  return autopilotProposal(deviceId, socPct);
}
