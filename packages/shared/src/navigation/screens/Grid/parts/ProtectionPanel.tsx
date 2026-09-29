/**
 * ProtectionPanel — mirrors grid-detail-desktop.jsx ProtectionPanel.
 *
 * Handoff rule 5: anti-islanding disarmed during a planned ride-through
 * reads "INACTIVE (ride-through)", never "BYPASSED" — audit wording. The
 * real armed/disarmed value still drives the row; the special wording only
 * applies to the specific disarmed + planned-island combination.
 *
 * "Export permit" is the operating envelope's export_limit relabeled, per
 * Joe (2026-09-13) — not a separate protection-scheme field.
 */

import React from "react";
import type { GridState } from "../../../../data/grid/useGridState";
import type { GridProtection } from "../../../../data/grid/useGridProtection";
import type { OperatingEnvelope } from "../../../../data/grid/useOperatingEnvelope";
import { GridPanel, GridRow } from "./GridPanel";

interface ProtectionPanelProps {
  state: GridState;
  protection: GridProtection;
  envelope: OperatingEnvelope;
}

export function ProtectionPanel({ state, protection, envelope }: ProtectionPanelProps): React.ReactElement {
  const plannedIsland = state.mode === "ISLAND" && state.islandQualifier === "planned";
  const antiIslandingLabel =
    protection.antiIslandingArmed === null
      ? "—"
      : protection.antiIslandingArmed
        ? "ARMED"
        : plannedIsland
          ? "INACTIVE (ride-through)"
          : "INACTIVE";

  return (
    <GridPanel title="Protection / interconnect">
      <GridRow
        k="Anti-islanding"
        v={antiIslandingLabel}
        tone={protection.antiIslandingArmed ? "ok" : protection.antiIslandingArmed === false ? "warn" : "soft"}
        hint={protection.antiIslandingArmed ? "IEEE 1547" : undefined}
      />
      <GridRow
        k="Ride-through"
        v={
          protection.rideThroughEnabled === null
            ? "—"
            : protection.rideThroughEnabled
              ? "ENABLED"
              : "DISABLED"
        }
        tone={protection.rideThroughEnabled ? "ok" : "warn"}
      />
      <GridRow
        k="Reconnect delay"
        v={protection.reconnectDelaySec === null ? "—" : protection.reconnectDelaySec.toFixed(0)}
        u={protection.reconnectDelaySec === null ? "" : "s"}
      />
      <GridRow
        k="Export permit"
        v={envelope.exportLimitW === null ? "—" : (Math.abs(envelope.exportLimitW) / 1_000_000).toFixed(2)}
        u={envelope.exportLimitW === null ? "" : "MW"}
      />
    </GridPanel>
  );
}
