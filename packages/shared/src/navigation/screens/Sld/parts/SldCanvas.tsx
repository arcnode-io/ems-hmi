/**
 * SldCanvas — web-only pan+zoom SLD viewer. Layout comes from
 * `layoutSld(topology)` (pure function) and renders via `<SldRenderer>`
 * (React/SVG). No more fetched fixture SVG — the diagram is fully
 * derived from /topology/view so arbitrary device counts work.
 *
 * Mouse wheel zooms (toward cursor); drag pans; double-click resets.
 * CSS for theming descends through `.sld-svg-root` and uses the same
 * data-* attribute hooks the renderer emits.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../../../theme/ThemeProvider";
import { useOperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { layoutSld } from "../layout/layoutSld";
import { SldRenderer } from "../layout/SldRenderer";

const MIN_SCALE = 0.25;
const MAX_SCALE = 6;
const WHEEL_ZOOM_FACTOR = 1.0015;
const FIT_PADDING = 24;

interface Transform {
  x: number;
  y: number;
  scale: number;
}

function fitTransform(svgW: number, svgH: number, boxW: number, boxH: number): Transform {
  if (boxW <= 0 || boxH <= 0) return { x: 0, y: 0, scale: 1 };
  const avW = Math.max(40, boxW - FIT_PADDING * 2);
  const avH = Math.max(40, boxH - FIT_PADDING * 2);
  const scale = Math.min(avW / svgW, avH / svgH);
  return {
    scale,
    x: FIT_PADDING + (avW - svgW * scale) / 2,
    y: FIT_PADDING + (avH - svgH * scale) / 2,
  };
}

function stateTokenLabel(doeState: string): string {
  if (doeState === "stale") return "STALE";
  if (doeState === "invalid") return "INVALID";
  if (doeState === "comm-fail") return "COMM FAIL";
  if (doeState === "island") return "ISLAND";
  return "OK";
}

export function SldCanvas(): React.ReactElement {
  const t = useTheme();
  const { status, view, error } = useTopologyView();
  const envelope = useOperatingEnvelope();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tx, setTx] = useState<Transform | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const layout = useMemo(() => (view ? layoutSld(view) : null), [view]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !layout) return;
    const apply = (): void => {
      const r = el.getBoundingClientRect();
      setTx(fitTransform(layout.width, layout.height, r.width, r.height));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return (): void => ro.disconnect();
  }, [layout]);

  const reset = useCallback((): void => {
    const el = containerRef.current;
    if (!el || !layout) return;
    const r = el.getBoundingClientRect();
    setTx(fitTransform(layout.width, layout.height, r.width, r.height));
  }, [layout]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setTx((prev) => {
      if (!prev) return prev;
      const factor = WHEEL_ZOOM_FACTOR ** -e.deltaY;
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
      const ratio = nextScale / prev.scale;
      return { scale: nextScale, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio };
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (!tx) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: tx.x, baseY: tx.y };
  }, [tx]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    const d = dragRef.current;
    if (!d) return;
    setTx((prev) => (prev ? { ...prev, x: d.baseX + (e.clientX - d.startX), y: d.baseY + (e.clientY - d.startY) } : prev));
  }, []);

  const onMouseUp = useCallback((): void => { dragRef.current = null; }, []);

  // Inject POI text content + token color into the rendered SVG. Cheaper
  // than re-rendering when only envelope.settlement / doeState changes.
  useEffect(() => {
    const root = containerRef.current?.querySelector(".sld-svg-root");
    if (!root) return;
    const primary = root.querySelector('[data-role="poi"] [data-region="primary-value"]');
    if (primary) primary.textContent = envelope.settlement;
    const token = root.querySelector('[data-role="poi"] [data-region="state-token"]');
    if (token) {
      token.textContent = stateTokenLabel(envelope.doeState);
      const color =
        envelope.doeState === "ok" || envelope.doeState === "island"
          ? t.textSoft
          : envelope.doeState === "stale"
            ? t.statusWarn
            : t.statusAlarm;
      (token as SVGElement).setAttribute("fill", color);
    }
  }, [envelope.settlement, envelope.doeState, t, layout]);

  const overlayLabel = (() => {
    if (status === "loading") return "Loading topology…";
    if (status === "error") return `Error: ${error ?? "unknown"}`;
    if (!view) return "Topology unavailable";
    return null;
  })();

  return (
    <div
      ref={containerRef}
      data-comp="SldCanvas"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDoubleClick={reset}
      style={{
        position: "relative", flex: 1, overflow: "hidden", backgroundColor: t.bg,
        cursor: dragRef.current ? "grabbing" : "grab", userSelect: "none", touchAction: "none",
      }}
    >
      {layout && tx && (
        <div
          className="sld-svg-root"
          style={{
            position: "absolute", top: 0, left: 0,
            transform: `translate(${tx.x}px, ${tx.y}px) scale(${tx.scale})`,
            transformOrigin: "0 0",
            color: t.text, fontFamily: t.fontLabel, fontSize: 11,
          }}
        >
          <SldRenderer layout={layout} envelopeDirection={envelope.direction} />
        </div>
      )}
      <style>{`
        .sld-svg-root [data-region="body"] { fill: ${t.surface}; stroke: ${t.border}; stroke-width: 1.5; }
        .sld-svg-root [data-comp="device-node"]:hover [data-region="body"] { stroke: ${t.accent}; stroke-width: 2; }
        .sld-svg-root [data-region="label-name"] { fill: ${t.text}; font-weight: 700; font-size: 11px; }
        .sld-svg-root [data-region="label-template"] { fill: ${t.textSoft}; font-size: 9px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
        .sld-svg-root [data-region="status-indicator"] { fill: ${t.statusOk}; stroke: ${t.surface}; stroke-width: 1.5; r: 5; }
        .sld-svg-root [data-comp="bus"] { stroke: ${t.textMid}; stroke-width: 3; stroke-linecap: round; fill: none; opacity: 0.55; }
        .sld-svg-root [data-comp="bus"][data-bus-type="ac"] { stroke-dasharray: 6 3; }
        .sld-svg-root [data-region="hit-area"] { cursor: pointer; }
        .sld-svg-root [data-role="poi"] [data-region="body"] { stroke: ${t.accent}; stroke-width: 2; }
        .sld-svg-root [data-role="poi"] [data-region="label-name"] { font-size: 9px; fill: ${t.textSoft}; transform: translateY(8px); }
        .sld-svg-root [data-role="poi"] [data-region="primary-value"] { fill: ${t.text}; font-weight: 700; font-size: 11px; transform: translateY(-4px); }
        .sld-svg-root [data-role="poi"] [data-region="state-label"] { fill: ${t.textSoft}; font-size: 7px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; transform: translateY(2px); }
        .sld-svg-root [data-role="poi"] [data-region="state-token"] { font-size: 7px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; transform: translateY(2px); }
        .sld-svg-root [data-role="poi"] [data-region="label-template"] { display: none; }
        .sld-svg-root [data-role="dlr-badge"] [data-region="body"] { stroke: ${t.textSoft}; stroke-width: 1; stroke-dasharray: 3 2; }
        .sld-svg-root [data-role="dlr-badge"] [data-region="label-name"] { font-size: 9px; fill: ${t.textSoft}; }
        .sld-svg-root [data-role="dlr-badge"] [data-region="label-template"] { display: none; }
      `}</style>
      {overlayLabel && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", color: t.textSoft, fontFamily: t.fontLabel, fontSize: 12,
          letterSpacing: 0.18, textTransform: "uppercase",
        }}>
          {overlayLabel}
        </div>
      )}
      <div style={{
        position: "absolute", right: 12, bottom: 12, color: t.textSoft, fontFamily: t.fontLabel,
        fontSize: 10, letterSpacing: 0.15, textTransform: "uppercase", opacity: 0.65,
      }}>
        {tx ? `${(tx.scale * 100).toFixed(0)}%` : "—"} · double-click resets
      </div>
    </div>
  );
}
