/**
 * Dispatch feedback events — the gateway publishes lifecycle on
 * `sites/{site}/devices/{dev}/events/dispatch_state`. This module parses the
 * payload and maps a gateway phase to the HMI's DispatchPhase, correlating by
 * command_id so stale/other-command events are ignored.
 *
 * Contract (handoff-frontend-to-ics-dispatch-contract-confirmed.md):
 *   { ts, command_id, phase: "received"|"done"|"failed", reason? }
 *   received → pending · done → settled (accepted, not "ramped") · failed → failed
 */

import { match } from "ts-pattern";
import type { DispatchPhase } from "../dispatch/dispatch.types";

export type GatewayPhase = "received" | "done" | "failed";

export interface DispatchEvent {
  ts: string;
  command_id: string;
  phase: GatewayPhase;
  reason?: string;
}

export interface DispatchTransition {
  phase: DispatchPhase;
  reason: string | null;
}

/** Narrow an unknown MQTT payload to a DispatchEvent, or null if malformed. */
export function parseDispatchEvent(value: unknown): DispatchEvent | null {
  const v = value as Partial<DispatchEvent> | null;
  if (typeof v !== "object" || v === null) return null;
  if (typeof v.command_id !== "string" || typeof v.ts !== "string") return null;
  if (v.phase !== "received" && v.phase !== "done" && v.phase !== "failed") {
    return null;
  }
  return {
    ts: v.ts,
    command_id: v.command_id,
    phase: v.phase,
    reason: typeof v.reason === "string" ? v.reason : undefined,
  };
}

/**
 * Map a gateway event to a lifecycle transition for the active command.
 * Returns null when the event correlates to a different (stale) command.
 */
export function applyDispatchEvent(
  event: DispatchEvent,
  activeCommandId: string | null,
): DispatchTransition | null {
  if (activeCommandId !== null && event.command_id !== activeCommandId) {
    return null;
  }
  return match(event.phase)
    .with("received", (): DispatchTransition => ({ phase: "pending", reason: null }))
    .with("done", (): DispatchTransition => ({ phase: "settled", reason: null }))
    .with("failed", (): DispatchTransition => ({ phase: "failed", reason: event.reason ?? null }))
    .exhaustive();
}
