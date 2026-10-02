/**
 * Status Strip GRID segment. Priority: ISLAND > operating-envelope headroom
 * in the flow direction, import when unknown (CURTAILED flagged alongside,
 * per Joe's 2026-09-25 review §2e) > CURTAILED alone > live net power. A non-OK
 * envelope status doesn't crowd the strip — last known headroom keeps
 * showing and the status routes to the alarm panel.
 */

export interface GridSegmentInput {
  mode: "GRID" | "ISLAND" | null;
  /** Net flow direction at the POI; null when ~zero or unknown. */
  direction: "IMP" | "EXP" | null;
  /** der_dispatch.event_active. */
  curtailed: boolean;
  importHeadroomW: number | null;
  exportHeadroomW: number | null;
  netPowerKw: number | null;
  netLabel: string | null;
  frequencyHz: number | null;
}

/** Watts → "1.3 MW" at ≥1 MW, else "90 kW". */
function fmtPower(watts: number): string {
  const abs = Math.abs(watts);
  return abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)} MW` : `${(abs / 1000).toFixed(0)} kW`;
}

/**
 * Derive the GRID segment's value + sub-label.
 * @param input grid mode, flow direction, curtailment, headroom, net power
 * @returns value + sub strings for the StatusStrip item
 */
export function gridSegment(input: GridSegmentInput): { value: string; sub: string } {
  if (input.mode === "ISLAND") return { value: "ISLAND", sub: "no utility coordination" };

  // Reason: direction comes from POI net power, unknown until the meter
  // reports. Unknown flow defaults to import — a load site's binding side.
  const exporting = input.direction === "EXP";
  const headroom = exporting ? input.exportHeadroomW : input.importHeadroomW;
  if (headroom !== null && headroom < 0) {
    // Reason: over the envelope. Never render the magnitude as headroom.
    const over = `${fmtPower(headroom)} over ${exporting ? "export" : "import"} limit`;
    return { value: "OVER LIMIT", sub: input.curtailed ? `Curtailed · ${over}` : over };
  }
  if (headroom !== null) {
    const which = exporting ? "Export headroom" : "Import headroom";
    return {
      value: `${exporting ? "−" : "+"}${fmtPower(headroom)}`,
      sub: input.curtailed ? `Curtailed · ${which}` : which,
    };
  }

  if (input.curtailed) return { value: "CURTAILED", sub: "Utility event active" };
  return {
    value:
      input.netPowerKw === null
        ? (input.netLabel ?? "—")
        : `${input.netLabel === "Export" ? "−" : "+"}${Math.abs(input.netPowerKw).toFixed(0)} kW`,
    sub: input.frequencyHz === null ? "—" : `${input.frequencyHz.toFixed(2)} Hz`,
  };
}
