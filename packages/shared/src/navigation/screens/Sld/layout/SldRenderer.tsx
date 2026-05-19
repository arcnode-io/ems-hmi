/**
 * Orchestrator that renders a positioned SldLayout via react-native-svg
 * primitives. Theme tokens are threaded through as props so the renderer
 * works the same on web and native — no CSS dependency.
 */

import React from "react";
import { Svg } from "react-native-svg";
import type { Theme } from "../../../../theme/tokens";
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

/** Subset of Theme the SLD renderer needs to colour itself. */
export interface SldTheme {
  surface: string;
  border: string;
  borderSoft: string;
  accent: string;
  text: string;
  textMid: string;
  textSoft: string;
  statusOk: string;
  fontLabel: string;
}

export function sldThemeFrom(t: Theme): SldTheme {
  return {
    surface: t.surface,
    border: t.border,
    borderSoft: t.borderSoft,
    accent: t.accent,
    text: t.text,
    textMid: t.textMid,
    textSoft: t.textSoft,
    statusOk: t.statusOk,
    fontLabel: t.fontLabel,
  };
}

interface SldRendererProps {
  layout: SldLayout;
  theme: SldTheme;
  envelopeDirection: "IMP" | "EXP" | null;
  onSelectDevice?: (deviceId: string) => void;
  statusByDevice?: Record<string, SldNodeStatus>;
  statusColors?: Record<SldNodeStatus, string>;
  poiOverlay?: PoiOverlay;
}

function statusFillResolver(
  statusByDevice: SldRendererProps["statusByDevice"],
  statusColors: SldRendererProps["statusColors"],
  fallback: string,
): (id: string) => string {
  return (id) => {
    const state = statusByDevice?.[id];
    return state && statusColors ? statusColors[state] : fallback;
  };
}

export function SldRenderer({
  layout,
  theme,
  envelopeDirection,
  onSelectDevice,
  statusByDevice,
  statusColors,
  poiOverlay,
}: SldRendererProps): React.ReactElement {
  const statusFillFor = statusFillResolver(statusByDevice, statusColors, theme.statusOk);
  return (
    <Svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}>
      {layout.conductors.map((c) => (
        <ConductorPath key={c.id} c={c} theme={theme} />
      ))}
      {layout.conductors.flatMap((c) =>
        c.particles.map((spec, i) => (
          <Particle
            key={`${c.id}_p${i}`}
            conductor={c}
            spec={spec}
            envelopeDirection={envelopeDirection}
            color={theme.text}
          />
        )),
      )}
      {layout.decorations.map((d) => (
        <DecorationByKind key={d.id} d={d} color={theme.text} />
      ))}
      {layout.nodes.map((n) => (
        <NodeBox
          key={n.id}
          n={n}
          theme={theme}
          onSelect={onSelectDevice}
          statusFill={statusFillFor(n.id)}
          poiOverlay={n.role === "poi" ? poiOverlay : undefined}
        />
      ))}
    </Svg>
  );
}
