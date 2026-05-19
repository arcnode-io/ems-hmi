/**
 * usePanZoom — wheel-zoom (toward cursor) + drag-pan + fit-to-container
 * transform for an SVG viewport. Used by SldCanvas; kept generic so other
 * spatial views can adopt it later.
 *
 * Exposed surface mirrors a tiny RN-Web event handler set so callers can
 * spread the returned handlers onto their pannable container element.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.25;
const MAX_SCALE = 6;
const WHEEL_ZOOM_FACTOR = 1.0015;
const FIT_PADDING_PX = 24;
const FIT_MIN_AVAILABLE_PX = 40;
const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  startClientX: number;
  startClientY: number;
  baseX: number;
  baseY: number;
}

interface PanZoomResult {
  /** Current transform; null until the container is first measured. */
  transform: Transform | null;
  /** Reset to the fit-to-container transform. Bind to double-click. */
  reset: () => void;
  /** Wheel handler — zooms toward cursor; preventsDefault. */
  onWheel: (e: React.WheelEvent<HTMLElement>) => void;
  /** Drag-pan handlers; bind to the same container. */
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseUp: () => void;
  /** Whether a drag is currently in progress (drives cursor style). */
  isDragging: boolean;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

/**
 * Compute the transform that fits an svgW×svgH content area inside a
 * boxW×boxH viewport, with a fixed padding margin and centered placement.
 */
function fitTransform(svgW: number, svgH: number, boxW: number, boxH: number): Transform {
  if (boxW <= 0 || boxH <= 0) return IDENTITY;
  const availableW = Math.max(FIT_MIN_AVAILABLE_PX, boxW - FIT_PADDING_PX * 2);
  const availableH = Math.max(FIT_MIN_AVAILABLE_PX, boxH - FIT_PADDING_PX * 2);
  const scale = Math.min(availableW / svgW, availableH / svgH);
  return {
    scale,
    x: FIT_PADDING_PX + (availableW - svgW * scale) / 2,
    y: FIT_PADDING_PX + (availableH - svgH * scale) / 2,
  };
}

/**
 * Hook that wires pan / zoom / fit for the given content size against a
 * container DOM ref. Re-fits on container resize. Returns React event
 * handlers + the current transform.
 */
export function usePanZoom(
  containerRef: React.MutableRefObject<HTMLElement | null>,
  contentSize: { width: number; height: number } | null,
): PanZoomResult {
  const [transform, setTransform] = useState<Transform | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !contentSize) return;
    const refit = (): void => {
      const rect = el.getBoundingClientRect();
      setTransform(fitTransform(contentSize.width, contentSize.height, rect.width, rect.height));
    };
    refit();
    const observer = new ResizeObserver(refit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentSize, containerRef]);

  const reset = useCallback((): void => {
    const el = containerRef.current;
    if (!el || !contentSize) return;
    const rect = el.getBoundingClientRect();
    setTransform(fitTransform(contentSize.width, contentSize.height, rect.width, rect.height));
  }, [contentSize, containerRef]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLElement>): void => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    setTransform((prev) => {
      if (!prev) return prev;
      const factor = WHEEL_ZOOM_FACTOR ** -e.deltaY;
      const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      // Reason: keep the point under the cursor stationary as we scale.
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        x: cursorX - (cursorX - prev.x) * ratio,
        y: cursorY - (cursorY - prev.y) * ratio,
      };
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLElement>): void => {
    if (!transform) return;
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      baseX: transform.x,
      baseY: transform.y,
    };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    setTransform((prev) =>
      prev
        ? {
            ...prev,
            x: drag.baseX + (e.clientX - drag.startClientX),
            y: drag.baseY + (e.clientY - drag.startClientY),
          }
        : prev,
    );
  }, []);

  const onMouseUp = useCallback((): void => {
    dragRef.current = null;
  }, []);

  return {
    transform,
    reset,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    isDragging: dragRef.current !== null,
  };
}
