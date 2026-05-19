/**
 * Orchestrator that renders a positioned SldLayout. NodeBox, ConductorPath,
 * Particle, and DecorationByKind own the visual primitives.
 */

import React from "react";
import type { SldLayout } from "./types";
import { ConductorPath, Particle } from "./Conductor";
import { DecorationByKind } from "./Decorations";
import { NodeBox } from "./NodeBox";

export type SldNodeStatus = "ok" | "warn" | "alarm" | "offline";

export interface PoiOverlay {
  settlement: string;
  stateToken: string;
  stateColor: string;
}

interface SldRendererProps {
  layout: SldLayout;
  envelopeDirection: "IMP" | "EXP" | null;
  onSelectDevice?: (deviceId: string) => void;
  statusByDevice?: Record<string, SldNodeStatus>;
  statusColors?: Record<SldNodeStatus, string>;
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
