/**
 * SldRenderer — renders a precomputed SldLayout as JSX SVG. The renderer
 * itself is just an orchestrator: NodeBox, ConductorPath, Particle, and
 * DecorationByKind own the visual primitives.
 *
 * Particle direction is chosen at render time per `envelopeDirection` —
 * no DOM post-edit overlay.
 */

import React from "react";
import type { SldLayout } from "./types";
import { ConductorPath, Particle } from "./Conductor";
import { DecorationByKind } from "./Decorations";
import { NodeBox } from "./NodeBox";

export type SldNodeStatus = "ok" | "warn" | "alarm" | "offline";

export interface PoiOverlay {
  /** Pre-formatted settlement reading, e.g. "+142 kW IMPORT". */
  settlement: string;
  /** Label shown in the POI state-token slot, e.g. "OK" / "STALE" / "ISLAND". */
  stateToken: string;
  /** Color (theme-resolved) for the state-token text — driven by severity. */
  stateColor: string;
}

interface SldRendererProps {
  layout: SldLayout;
  /** POI net-flow direction; controls every conductor with flowSource=envelope. */
  envelopeDirection: "IMP" | "EXP" | null;
  /** Fired when a device node is tapped/clicked. Wires SLD → device detail. */
  onSelectDevice?: (deviceId: string) => void;
  /** Per-device status override for the status-indicator dot. */
  statusByDevice?: Record<string, SldNodeStatus>;
  /** Theme-resolved colors for each status. */
  statusColors?: Record<SldNodeStatus, string>;
  /** Live values rendered into the POI node's text slots. */
  poiOverlay?: PoiOverlay;
}

function statusFillResolver(
  statusByDevice: SldRendererProps["statusByDevice"],
  statusColors: SldRendererProps["statusColors"],
): (id: string) => string | undefined {
  return (id) => {
    const state = statusByDevice?.[id];
    return state && statusColors ? statusColors[state] : undefined;
  };
}

export function SldRenderer({
  layout,
  envelopeDirection,
  onSelectDevice,
  statusByDevice,
  statusColors,
  poiOverlay,
}: SldRendererProps): React.ReactElement {
  const statusFillFor = statusFillResolver(statusByDevice, statusColors);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
    >
      {layout.conductors.map((c) => (
        <ConductorPath key={c.id} c={c} />
      ))}
      {layout.conductors.flatMap((c) =>
        c.particles.map((spec, i) => (
          <Particle
            key={`${c.id}_p${i}`}
            conductor={c}
            spec={spec}
            envelopeDirection={envelopeDirection}
          />
        )),
      )}
      {layout.decorations.map((d) => (
        <DecorationByKind key={d.id} d={d} />
      ))}
      {layout.nodes.map((n) => (
        <NodeBox
          key={n.id}
          n={n}
          onSelect={onSelectDevice}
          statusFill={statusFillFor(n.id)}
          poiOverlay={n.role === "poi" ? poiOverlay : undefined}
        />
      ))}
    </svg>
  );
}
