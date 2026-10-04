/**
 * Operator battery reserve — der_dispatch.operator_reserve, Wh on the wire,
 * MWh in the UI. The gateway holds the battery at max(supplier floor,
 * operator reserve); a nonsense value is merely ineffective. Backend
 * contract 2026-10-03: retained state (absent = 0), set command `{ts, value}`.
 */

import type { TopologyViewType } from "../topology/topology.schema";
import { commandTopic, measurementTopic } from "../topics/topicBuilder";

const DER_DISPATCH_TEMPLATE = "der_dispatch";
const RESERVE = "operator_reserve";
// Reason: half-MWh is fine-grained enough for a ride-through reserve and
// keeps the stepper to a handful of clicks across an 8 MWh pack.
const STEP_MWH = 0.5;

/**
 * State + set-command topics. Null unless the site has der_dispatch AND its
 * template declares operator_reserve (mock fixtures don't → no dead control).
 */
export function operatorReserveTopics(
  view: Pick<TopologyViewType, "devices" | "templates_used">,
  siteId: string,
): { state: string; command: string } | null {
  if (view.templates_used[DER_DISPATCH_TEMPLATE]?.measurements[RESERVE] === undefined) return null;
  const device = Object.values(view.devices).find((dev) => dev.template === DER_DISPATCH_TEMPLATE);
  if (device === undefined) return null;
  return {
    state: measurementTopic(siteId, device.device_id, RESERVE, "watt_hours"),
    command: commandTopic(siteId, device.device_id, "set", RESERVE, "watt_hours"),
  };
}

/** Wire value → Wh. `unknown`: untrusted broker input. Absent/invalid = 0, negatives clamp. */
export function parseReserveWh(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** One stepper click: snap to the 0.5 MWh grid in `direction`, clamped to [0, pack]. */
export function stepReserveMwh(currentMwh: number, direction: 1 | -1, packMwh: number): number {
  const snapped =
    direction === 1
      ? Math.floor(currentMwh / STEP_MWH) * STEP_MWH + STEP_MWH
      : Math.ceil(currentMwh / STEP_MWH) * STEP_MWH - STEP_MWH;
  return Math.min(packMwh, Math.max(0, snapped));
}
