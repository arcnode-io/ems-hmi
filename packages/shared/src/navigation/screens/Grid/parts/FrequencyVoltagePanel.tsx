/**
 * FrequencyVoltagePanel — mirrors grid-detail-desktop.jsx FreqVoltPanel.
 * LV bus is intentionally absent (no metering equipment specced on any
 * transformer secondary — see useGridPowerQuality's doc comment).
 */

import React from "react";
import type { GridState } from "../../../../data/grid/useGridState";
import type { GridPowerQuality } from "../../../../data/grid/useGridPowerQuality";
import { GridPanel, GridRow } from "./GridPanel";

interface FrequencyVoltagePanelProps {
  state: GridState;
  pq: GridPowerQuality;
}

export function FrequencyVoltagePanel({ state, pq }: FrequencyVoltagePanelProps): React.ReactElement {
  const islanded = state.mode === "ISLAND";
  return (
    <GridPanel title="Frequency / voltage" meta={islanded ? "site-formed" : "utility reference"}>
      <GridRow
        k="Frequency"
        v={state.frequencyHz === null ? "—" : state.frequencyHz.toFixed(2)}
        u="Hz"
        tone={islanded ? "warn" : "ok"}
      />
      <GridRow
        k="MV bus"
        v={pq.mvBusVoltageV === null ? "—" : (pq.mvBusVoltageV / 1000).toFixed(2)}
        u={pq.mvBusVoltageV === null ? "" : "kV"}
        hint="A-B-C avg"
      />
      <GridRow
        k="THD-V"
        v={pq.thdVPercent === null ? "—" : pq.thdVPercent.toFixed(1)}
        u={pq.thdVPercent === null ? "" : "%"}
      />
      <GridRow
        k="Unbalance"
        v={pq.voltageUnbalancePct === null ? "—" : pq.voltageUnbalancePct.toFixed(1)}
        u={pq.voltageUnbalancePct === null ? "" : "%"}
      />
    </GridPanel>
  );
}
