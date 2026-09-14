/**
 * ProtectionPanel — mirrors grid-detail-desktop.jsx ProtectionPanel.
 * "Export permit" is operating_envelope.export_limit relabeled, per Joe
 * (2026-09-13) — not a separate protection-scheme field.
 *
 * Handoff rule 5: anti-islanding disarmed during a planned ride-through
 * reads "INACTIVE (ride-through)", never "BYPASSED" — audit wording. The
 * real armed/disarmed value still drives the row; the special wording only
 * applies to the specific disarmed + planned-island combination.
 */

import React from "react";
import type { GridState } from "../../../../data/grid/useGridState";
import type { GridProtection } from "../../../../data/grid/useGridProtection";
import { GridPanel, GridRow } from "./GridPanel";

interface ProtectionPanelProps {
  state: GridState;
  protection: GridProtection;
}

export function ProtectionPanel({ state, protection }: ProtectionPanelProps): React.ReactElement {
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
        v={state.exportLimitKw === null ? "—" : (Math.abs(state.exportLimitKw) / 1000).toFixed(1)}
        u={state.exportLimitKw === null ? "" : "MW"}
      />
    </GridPanel>
  );
}
