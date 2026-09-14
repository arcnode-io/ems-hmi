/**
 * UtilityLimitsPanel — standing DOE import/export limits, the DLR feed
 * (a separate real reading — conductor ampacity, not the same pipeline as
 * the DOE limit), and the curtailment cap when a der_dispatch event is
 * active. Mirrors grid-detail-desktop.jsx's "Utility limits" card +
 * ImportLimitLine, adapted to two genuinely distinct real feeds instead of
 * the mock's single synthetic GRID_LIMIT.
 */

import React from "react";
import type { GridState } from "../../../../data/grid/useGridState";
import { GridPanel, GridRow } from "./GridPanel";

export function UtilityLimitsPanel({ state }: { state: GridState }): React.ReactElement {
  const islanded = state.mode === "ISLAND";

  return (
    <GridPanel title="Utility limits">
      <GridRow
        k="Import limit"
        v={islanded || state.importLimitKw === null ? "—" : state.importLimitKw.toFixed(1)}
        u={islanded ? "" : "MW"}
        tone={islanded ? "soft" : "default"}
      />
      <GridRow
        k="Export limit"
        v={islanded || state.exportLimitKw === null ? "—" : state.exportLimitKw.toFixed(1)}
        u={islanded ? "" : "MW"}
        tone={islanded ? "soft" : "default"}
      />
      <GridRow
        k="Line rating (DLR)"
        v={state.dlrAmps === null ? "—" : state.dlrAmps.toFixed(0)}
        u={state.dlrAmps === null ? "" : "A"}
        tone={state.dlrStatus === "ok" ? "default" : "warn"}
        hint={state.dlrStatus !== "ok" ? state.dlrStatus : undefined}
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
