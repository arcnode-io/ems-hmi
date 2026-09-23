/**
 * DispatchStatusPanel — der_dispatch's state + the curtailment cap when an
 * event is active. Was "UtilityLimitsPanel" (standing DOE import/export
 * limits + the DLR feed); both were removed 2026-09-23 — ArcNode has no
 * visibility into either on the real system (utility interconnect is
 * IEEE 2030.5, see ~/arcnode/ems/readme.md). What's left is genuinely
 * der_dispatch-only, so this panel was renamed to match.
 */

import React from "react";
import type { GridState } from "../../../../data/grid/useGridState";
import { GridPanel, GridRow } from "./GridPanel";

export function DispatchStatusPanel({ state }: { state: GridState }): React.ReactElement {
  return (
    <GridPanel title="DER dispatch">
      <GridRow
        k="DER dispatch state"
        v={state.derDispatchState ?? "—"}
        tone={
          state.derDispatchState === "ACTIVE"
            ? "warn"
            : state.derDispatchState === "REJECTED"
              ? "alarm"
              : state.derDispatchState === "PENDING" || state.derDispatchState === "ARMED"
                ? "warn"
                : "default"
        }
      />
      {state.curtailmentActive ? (
        <GridRow
          k="Curtailment cap"
          v={
            state.curtailmentCapW === null
              ? "—"
              : (Math.abs(state.curtailmentCapW) / 1_000_000).toFixed(2)
          }
          u={state.curtailmentCapW === null ? "" : "MW"}
          tone="warn"
          hint="active event"
        />
      ) : null}
    </GridPanel>
  );
}
