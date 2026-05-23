/**
 * usePanZoom — pointer-events drag-pan + pinch-zoom + wheel-zoom-to-cursor
 * + fit-to-container for any HTMLElement viewport. Unified handler covers
 * mouse, touch, pen.
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

interface PinchState {
  initialDistance: number;
  initialScale: number;
  baseX: number;
  baseY: number;
  midX: number;
  midY: number;
}

interface Point {
  x: number;
  y: number;
}

interface PanZoomResult {
  transform: Transform | null;
  reset: () => void;
  onWheel: (e: React.WheelEvent<HTMLElement>) => void;
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  isDragging: boolean;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

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

export function usePanZoom(
  containerRef: React.MutableRefObject<HTMLElement | null>,
  contentSize: { width: number; height: number } | null,
): PanZoomResult {
  const [transform, setTransform] = useState<Transform | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);

  const refit = useCallback((): void => {
    const el = containerRef.current;
    if (!el || !contentSize) return;
    const rect = el.getBoundingClientRect();
    setTransform(fitTransform(contentSize.width, contentSize.height, rect.width, rect.height));
  }, [contentSize, containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !contentSize) return;
    refit();
    const observer = new ResizeObserver(refit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentSize, containerRef, refit]);

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

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>): void => {
    if (!transform) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const p: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointersRef.current.set(e.pointerId, p);
    if (pointersRef.current.size === 1) {
      dragRef.current = { startClientX: e.clientX, startClientY: e.clientY, baseX: transform.x, baseY: transform.y };
      pinchRef.current = null;
      return;
    }
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      if (!a || !b) return;
      pinchRef.current = {
        initialDistance: distance(a, b),
        initialScale: transform.scale,
        baseX: transform.x,
        baseY: transform.y,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      };
      dragRef.current = null;
    }
  }, [transform]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>): void => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointersRef.current.set(e.pointerId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      if (!a || !b) return;
      const curDistance = distance(a, b);
      const nextScale = clamp(pinch.initialScale * (curDistance / pinch.initialDistance), MIN_SCALE, MAX_SCALE);
      const ratio = nextScale / pinch.initialScale;
      // Reason: keep the pinch midpoint stationary while scaling.
      setTransform({
        scale: nextScale,
        x: pinch.midX - (pinch.midX - pinch.baseX) * ratio,
        y: pinch.midY - (pinch.midY - pinch.baseY) * ratio,
      });
      return;
    }
    const drag = dragRef.current;
    if (drag && pointersRef.current.size === 1) {
      setTransform((prev) =>
        prev
          ? {
              ...prev,
              x: drag.baseX + (e.clientX - drag.startClientX),
              y: drag.baseY + (e.clientY - drag.startClientY),
            }
          : prev,
      );
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>): void => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
  }, []);

  return {
    transform,
    reset: refit,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isDragging: dragRef.current !== null,
  };
}
