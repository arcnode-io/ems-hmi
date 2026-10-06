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

export type ReserveConfirmation = "idle" | "waiting" | "confirmed" | "unconfirmed";

/**
 * Idle → 10 s window. Reason: the idle round trip (send → controller →
 * retained echo → tile) measures ~2 s; 5× that is long enough to never
 * false-alarm and short enough that a dead subscriber shows within a glance.
 */
export const CONFIRM_TIMEOUT_MS = 10_000;

/**
 * Has the controller acknowledged what the operator sent? Confirmed = the
 * retained echo equals the sent value (Wh-rounded, the wire precision).
 * Without this, a dead controller subscriber leaves the tile silently stale.
 */
export function reserveConfirmation(
  pending: { mwh: number; sentAtMs: number } | null,
  reserveMwh: number,
  nowMs: number,
): ReserveConfirmation {
  if (pending === null) return "idle";
  if (Math.round(pending.mwh * 1_000_000) === Math.round(reserveMwh * 1_000_000)) return "confirmed";
  return nowMs - pending.sentAtMs >= CONFIRM_TIMEOUT_MS ? "unconfirmed" : "waiting";
}
