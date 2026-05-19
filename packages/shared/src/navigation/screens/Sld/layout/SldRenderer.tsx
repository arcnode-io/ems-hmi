/**
 * SldRenderer — renders a precomputed SldLayout as JSX SVG. Replaces the
 * fetched edp-api SVG fixture entirely. Nodes carry the same data-* hooks
 * the SldCanvas CSS expects (data-comp, data-region, data-role) so all
 * existing theming (surface, accent, status indicator) keeps working.
 *
 * Particle direction is chosen at render-time per envelope.direction —
 * no more DOM-poke post-render effects.
 */

import React from "react";
import type {
  SldLayout,
  SldNode,
  SldConductor,
  SldDecoration,
  ParticleSpec,
} from "./types";

interface SldRendererProps {
  layout: SldLayout;
  /** POI net-flow direction; controls every conductor with flowSource=envelope. */
  envelopeDirection: "IMP" | "EXP" | null;
  /** Fired when a device node is tapped/clicked. Wires SLD → device detail. */
  onSelectDevice?: (deviceId: string) => void;
}

function pathString(c: SldConductor, reverse: boolean): string {
  return reverse
    ? `M ${c.x2} ${c.y2} L ${c.x1} ${c.y1}`
    : `M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`;
}

function Particle({
  conductor,
  spec,
  envelopeDirection,
}: {
  conductor: SldConductor;
  spec: ParticleSpec;
  envelopeDirection: "IMP" | "EXP" | null;
}): React.ReactElement {
  const flip =
    conductor.flowSource?.kind === "envelope" && envelopeDirection === "EXP";
  const path = pathString(conductor, flip);
  return (
    <circle data-region="particle" r={spec.radius} fill="currentColor" opacity={0.75}>
      <animateMotion
        dur={`${spec.durationSec}s`}
        begin={`${spec.beginOffsetSec}s`}
        repeatCount="indefinite"
        path={path}
      />
    </circle>
  );
}

function ConductorPath({ c }: { c: SldConductor }): React.ReactElement {
  const isBus = c.kind === "ac" && c.id === "ac_bus_1";
  const isDcBus = c.kind === "dc" && c.id === "dc_bus_1";
  // Polyline routing for info conductors (right-angle bends); otherwise
  // a straight M-L line between endpoints.
  const d = c.points && c.points.length > 0
    ? [
        `M ${c.x1} ${c.y1}`,
        ...c.points.map((p) => `L ${p.x} ${p.y}`),
        `L ${c.x2} ${c.y2}`,
      ].join(" ")
    : `M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`;
  const baseAttrs: React.SVGProps<SVGPathElement> = {
    d,
    fill: "none",
    stroke: "currentColor",
  };
  if (isBus || isDcBus) {
    return (
      <path
        {...baseAttrs}
        id={c.id}
        data-comp="bus"
        data-bus-type={isBus ? "ac" : "dc"}
      />
    );
  }
  // Soft drops / info lines get reduced opacity and optional dashes.
  return (
    <path
      {...baseAttrs}
      strokeWidth={c.kind === "info" ? 1 : c.kind === "drop" ? 1.5 : 2}
      strokeDasharray={c.dashed ? "2 2" : undefined}
      opacity={c.dashed ? 0.5 : c.kind === "drop" ? 0.7 : 1}
    />
  );
}

function Breaker({ d }: { d: SldDecoration }): React.ReactElement {
  return (
    <g data-comp="breaker" transform={`translate(${d.x} ${d.y})`}>
      <circle data-region="ring" cx={0} cy={0} r={7} fill="none" stroke="currentColor" strokeWidth={1.5} />
      {d.state === "open" ? (
        <line x1={-4} y1={0} x2={4} y2={-5} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      ) : (
        <line x1={-4} y1={0} x2={4} y2={0} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      )}
    </g>
  );
}

function Inverter({ d }: { d: SldDecoration }): React.ReactElement {
  return (
    <g data-comp="inverter" transform={`translate(${d.x} ${d.y})`}>
      <circle data-region="ring" cx={0} cy={0} r={9} fill="none" stroke="currentColor" strokeWidth={1.2} />
      <text data-region="glyph" x={0} y={3} textAnchor="middle" fill="currentColor" fontSize={11} fontWeight={700}>
        ~
      </text>
    </g>
  );
}

function NodeBox({ n, onSelect }: { n: SldNode; onSelect?: (id: string) => void }): React.ReactElement {
  const w = n.width;
  const h = n.height;
  const baseGroupAttrs: React.SVGProps<SVGGElement> = {
    id: n.id,
    transform: `translate(${n.x} ${n.y})`,
    onClick: onSelect ? () => onSelect(n.id) : undefined,
  };
  // Per-role data-attr emits hooks the existing CSS already targets.
  const groupAttrs = {
    ...baseGroupAttrs,
    "data-comp": "device-node",
    "data-template": n.template,
    ...(n.role ? { "data-role": n.role } : {}),
  } as React.SVGProps<SVGGElement>;
  return (
    <g {...groupAttrs}>
      <rect data-region="body" x={-w / 2} y={-h / 2} width={w} height={h} rx={n.role === "poi" ? 4 : 3} fill="currentColor" />
      <circle data-region="status-indicator" cx={w / 2 - 7} cy={-h / 2 + 8} r={3} />
      {n.role === "poi" && (
        <>
          <text data-region="primary-value" x={0} y={-2} textAnchor="middle" fill="currentColor" />
          <text data-region="label-name" x={0} y={0} textAnchor="middle" fill="currentColor">{n.displayName}</text>
          <text data-region="label-template" x={0} y={14} textAnchor="middle" fill="currentColor">{n.template}</text>
          <text data-region="state-label" x={-22} y={16} textAnchor="middle" fill="currentColor">DOE</text>
          <text data-region="state-token" x={22} y={16} textAnchor="middle" fill="currentColor" />
        </>
      )}
      {n.role !== "poi" && (
        <>
          <text data-region="label-name" x={0} y={-2} textAnchor="middle" fill="currentColor">{n.displayName}</text>
          <text data-region="label-template" x={0} y={n.template === "cdu" ? 10 : 12} textAnchor="middle" fill="currentColor">{n.template}</text>
        </>
      )}
      <rect data-region="hit-area" x={-w / 2} y={-h / 2} width={w} height={h} fill="transparent" />
    </g>
  );
}

/**
 * Render a positioned SLD layout.
 */
export function SldRenderer({ layout, envelopeDirection, onSelectDevice }: SldRendererProps): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
    >
      {/* Conductors render before nodes so device bodies sit on top. */}
      {layout.conductors.map((c) => (
        <ConductorPath key={c.id} c={c} />
      ))}
      {layout.conductors.flatMap((c) =>
        c.particles.map((p, i) => (
          <Particle key={`${c.id}_p${i}`} conductor={c} spec={p} envelopeDirection={envelopeDirection} />
        )),
      )}
      {layout.decorations.map((d) =>
        d.kind === "breaker" ? <Breaker key={d.id} d={d} /> : <Inverter key={d.id} d={d} />,
      )}
      {layout.nodes.map((n) => (
        <NodeBox key={n.id} n={n} onSelect={onSelectDevice} />
      ))}
    </svg>
  );
}
