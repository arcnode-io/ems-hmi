/**
 * DispatchStatusPanel — der_dispatch's state. The utility's limit lives in
 * EnvelopePanel; target_active_power isn't shown until upstream makes it a
 * real setpoint.
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
    </GridPanel>
  );
}
