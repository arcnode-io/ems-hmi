/**
 * DER demand-response approval (MANUAL dispatch mode): which banner to
 * show, and where approve/reject publish. Backend contract 2026-10-03:
 * der_event_state PENDING until the operator acts → ACTIVE / REJECTED.
 */

import { match, P } from "ts-pattern";
import type { GridState } from "./useGridState";
import type { TopologyViewType } from "../topology/topology.schema";
import { commandTopic } from "../topics/topicBuilder";

export type DerBannerKind = "active" | "pending" | "rejected" | "none";
export type DerDecision = "approve" | "reject";

const DER_DISPATCH_TEMPLATE = "der_dispatch";

/** Active event wins (it's what's constraining the site now), then a pending ask, then a rejection. */
export function derBannerKind(state: Pick<GridState, "curtailmentActive" | "derDispatchState">): DerBannerKind {
  return match(state)
    .with({ curtailmentActive: true }, () => "active" as const)
    .with({ derDispatchState: "PENDING" }, () => "pending" as const)
    .with({ derDispatchState: "REJECTED" }, () => "rejected" as const)
    .with({ derDispatchState: P._ }, () => "none" as const)
    .exhaustive();
}

/**
 * Command topic for approve (verb enable) / reject (verb disable) on
 * der_dispatch.event_active. Null when the site has no der_dispatch device.
 */
export function derCommandTopic(
  devices: TopologyViewType["devices"],
  siteId: string,
  decision: DerDecision,
): string | null {
  const device = Object.values(devices).find((dev) => dev.template === DER_DISPATCH_TEMPLATE);
  if (device === undefined) return null;
  return commandTopic(siteId, device.device_id, decision === "approve" ? "enable" : "disable", "event_active", "none");
}
