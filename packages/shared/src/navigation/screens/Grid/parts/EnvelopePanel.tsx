/**
 * EnvelopePanel — the site's dynamic operating envelope: the utility's
 * import/export limits at the POI (CSIP-AUS opModImpLimW / opModExpLimW —
 * an extension, not base IEEE 2030.5) and the headroom left inside them.
 * Headroom is the gateway's own number, the one its control law clamps
 * against. Curtailment lives in DispatchStatusPanel alongside this one.
 */

import React from "react";
import type { OperatingEnvelope } from "../../../../data/grid/useOperatingEnvelope";
import { GridPanel, GridRow } from "./GridPanel";

interface EnvelopePanelProps {
  envelope: OperatingEnvelope;
  islanded: boolean;
}

/** Watts → MW string with 2 decimals, or "—". */
function mw(watts: number | null): string {
  return watts === null ? "—" : (Math.abs(watts) / 1_000_000).toFixed(2);
}

export function EnvelopePanel({ envelope, islanded }: EnvelopePanelProps): React.ReactElement {
  const degraded = envelope.status !== null && envelope.status !== "ok";
  // Reason: rule 3.11 — islanded, the envelope doesn't apply; say n/a, not "—".
  const tone = islanded ? "soft" : degraded ? "warn" : "default";
  const unit = (w: number | null): string => (islanded || w === null ? "" : "MW");
  const val = (w: number | null): string => (islanded ? "n/a" : mw(w));
  const used = envelope.usedFraction;

  return (
    <GridPanel title="Operating envelope">
      <GridRow
        k="Import limit"
        v={val(envelope.importLimitW)}
        u={unit(envelope.importLimitW)}
        tone={tone}
        hint={degraded ? envelope.status ?? undefined : undefined}
      />
      <GridRow k="Export limit" v={val(envelope.exportLimitW)} u={unit(envelope.exportLimitW)} tone={tone} />
      <GridRow
        k="Import headroom"
        v={val(envelope.importHeadroomW)}
        u={unit(envelope.importHeadroomW)}
        tone={tone}
        hint="at POI"
      />
      <GridRow
        k="Limit in use"
        v={islanded ? "n/a" : used === null ? "—" : (used * 100).toFixed(0)}
        u={islanded || used === null ? "" : "%"}
        tone={tone}
      />
    </GridPanel>
  );
}
