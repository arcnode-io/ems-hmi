/**
 * Native pan + fit-to-container SLD viewer. Uses View + PanResponder via
 * `usePanZoom` and renders the same `<SldRenderer>` that web ships.
 */

import React, { useMemo, useRef } from "react";
import { View, Text, type View as ViewType } from "react-native";
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
  const containerRef = useRef<ViewType | null>(null);

  const layout = useMemo(() => (view ? layoutSld(view) : null), [view]);
  const panZoom = usePanZoom(containerRef, layout);

  const sldTheme = useMemo(() => sldThemeFrom(t), [t]);
  const statusByDevice = useMemo(() => foldAlarmsToStatus(alarms), [alarms]);
  const statusColors = useMemo(() => statusColorsFromTheme(t), [t]);
  const poiOverlay = useMemo(() => buildPoiOverlay(envelope, t), [envelope, t]);

  const overlayLabel = statusOverlayLabel({ status, error, hasView: view !== null });
  const tx = panZoom.transform;

  return (
    <View
      ref={containerRef}
      onLayout={panZoom.onLayout}
      {...panZoom.panHandlers}
      style={{ position: "relative", flex: 1, overflow: "hidden", backgroundColor: t.bg }}
    >
      {layout && tx && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ translateX: tx.x }, { translateY: tx.y }, { scale: tx.scale }],
            // RN scales from the View center by default; lock the origin to
            // top-left by sizing the inner View exactly to the SVG bounds.
            width: layout.width,
            height: layout.height,
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
        </View>
      )}
      {match(overlayLabel)
        .with(P.string, (text) => (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
            pointerEvents="none"
          >
            <Text
              style={{
                color: t.textSoft,
                fontFamily: t.fontLabel,
                fontSize: STATUS_FONT_SIZE,
                letterSpacing: STATUS_LETTER_SPACING,
                textTransform: "uppercase",
              }}
            >
              {text}
            </Text>
          </View>
        ))
        .otherwise(() => null)}
      <View
        style={{
          position: "absolute",
          right: ZOOM_INDICATOR_INSET_PX,
          bottom: ZOOM_INDICATOR_INSET_PX,
          opacity: 0.65,
        }}
        pointerEvents="none"
      >
        <Text
          style={{
            color: t.textSoft,
            fontFamily: t.fontLabel,
            fontSize: ZOOM_INDICATOR_FONT_SIZE,
            letterSpacing: ZOOM_INDICATOR_LETTER_SPACING,
            textTransform: "uppercase",
          }}
        >
          {zoomIndicatorText(tx?.scale)} · drag to pan
        </Text>
      </View>
    </View>
  );
}
