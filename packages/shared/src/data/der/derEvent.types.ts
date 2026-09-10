/**
 * DER-control event types — mirrors the locked `der_dispatch` measurement
 * contract (IEEE 2030.5 DERControl, Option A / MVP): 3 measurements, no
 * dedicated event message. See:
 * /tmp/HANDOFF-der-control-hmi-panel-2026-09-07-RESPONSE.md
 *
 * Demo-only for now — DerEventSimulator + MockDerEventProvider stand in
 * until ems-device-api's AsyncAPI generator emits the real `der_dispatch`
 * subscriptions (tracked with ⚙️ backend-engineer). At that point this
 * state shape is read straight off `useSubscription` instead of the mock
 * provider — no consumer change.
 */

export interface DerEventState {
  /** `event_active` — a utility curtailment event is in progress. */
  eventActive: boolean;
  /** Wall-clock ms (performance.now basis) the event began; null while quiet. */
  activeSinceMs: number | null;
  /** `target_active_power`, signed watts. Negative = charge/import (curtail). */
  targetActivePowerW: number;
  /** `energize_enabled`. */
  energizeEnabled: boolean;
}
