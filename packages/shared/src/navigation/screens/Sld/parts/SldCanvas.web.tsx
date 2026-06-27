/**
 * Web pan+zoom viewer wrapping `<SldRenderer>`. Drag-pan + wheel-zoom + fit.
 * Theme is threaded through props (no CSS dependency).
 */

import React, { useMemo, useRef } from "react";
import { match, P } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { useOperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useAlarms } from "../../../../data/alarms/useAlarms";
import { layoutSld } from "../layout/layoutSld";
import { SldRenderer, sldThemeFrom } from "../layout/SldRenderer";
import {
  buildPoiOverlay,
  foldAlarmsToStatus,
  statusColorsFromTheme,
} from "../helpers/sldStatus";
import { usePanZoom } from "../hooks/usePanZoom";

const STATUS_FONT_SIZE = 12;
const STATUS_LETTER_SPACING = 0.18;
const ZOOM_INDICATOR_FONT_SIZE = 10;
const ZOOM_INDICATOR_LETTER_SPACING = 0.15;
const ZOOM_INDICATOR_INSET_PX = 12;

interface SldCanvasProps {
  onSelectDevice?: (deviceId: string) => void;
}

interface FetchState {
  status: ReturnType<typeof useTopologyView>["status"];
  error: string | null;
  hasView: boolean;
}

function statusOverlayLabel({ status, error, hasView }: FetchState): string | null {
  return match({ status, hasView })
    .with({ status: "loading" }, () => "Loading topology…")
    .with({ status: "error" }, () => `Error: ${error ?? "unknown"}`)
    .with({ hasView: false }, () => "Topology unavailable")
    .otherwise(() => null);
}

function zoomIndicatorText(scale: number | undefined): string {
  return scale !== undefined ? `${(scale * 100).toFixed(0)}%` : "—";
}

export function SldCanvas({ onSelectDevice }: SldCanvasProps = {}): React.ReactElement {
  const t = useTheme();
  const { status, view, error } = useTopologyView();
  const envelope = useOperatingEnvelope();
  const alarms = useAlarms();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const layout = useMemo(() => (view ? layoutSld(view) : null), [view]);
  const panZoom = usePanZoom(containerRef, layout);

  const sldTheme = useMemo(() => sldThemeFrom(t), [t]);
  const statusByDevice = useMemo(() => foldAlarmsToStatus(alarms), [alarms]);
  const statusColors = useMemo(() => statusColorsFromTheme(t), [t]);
  const poiOverlay = useMemo(() => buildPoiOverlay(envelope, t), [envelope, t]);

  const overlayLabel = statusOverlayLabel({ status, error, hasView: view !== null });

  return (
    <div
      ref={containerRef}
      data-comp="SldCanvas"
      data-testid="sld-canvas"
      onWheel={panZoom.onWheel}
      onPointerDown={panZoom.onPointerDown}
      onPointerMove={panZoom.onPointerMove}
      onPointerUp={panZoom.onPointerUp}
      onPointerCancel={panZoom.onPointerUp}
      onDoubleClick={panZoom.reset}
      style={{
        position: "relative",
        flex: 1,
        overflow: "hidden",
        backgroundColor: t.bg,
        cursor: panZoom.isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {layout && panZoom.transform && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${panZoom.transform.x}px, ${panZoom.transform.y}px) scale(${panZoom.transform.scale})`,
            transformOrigin: "0 0",
            fontFamily: t.fontLabel,
          }}
        >
          <SldRenderer
            layout={layout}
            theme={sldTheme}
            envelopeDirection={envelope.direction}
            onSelectDevice={onSelectDevice}
            statusByDevice={statusByDevice}
            statusColors={statusColors}
            poiOverlay={poiOverlay}
          />
        </div>
      )}
      {match(overlayLabel)
        .with(P.string, (text) => (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              color: t.textSoft,
              fontFamily: t.fontLabel,
              fontSize: STATUS_FONT_SIZE,
              letterSpacing: STATUS_LETTER_SPACING,
              textTransform: "uppercase",
            }}
          >
            {text}
          </div>
        ))
        .otherwise(() => null)}
      <div
        style={{
          position: "absolute",
          right: ZOOM_INDICATOR_INSET_PX,
          bottom: ZOOM_INDICATOR_INSET_PX,
          color: t.textSoft,
          fontFamily: t.fontLabel,
          fontSize: ZOOM_INDICATOR_FONT_SIZE,
          letterSpacing: ZOOM_INDICATOR_LETTER_SPACING,
          textTransform: "uppercase",
          opacity: 0.65,
        }}
      >
        {zoomIndicatorText(panZoom.transform?.scale)} · double-click resets
      </div>
    </div>
  );
}
