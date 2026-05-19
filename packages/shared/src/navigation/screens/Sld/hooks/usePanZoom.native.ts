/**
 * Native pan + fit-to-container hook. Uses View's `onLayout` for fit and
 * PanResponder for drag; pinch-zoom is intentionally omitted for the MVP
 * — operators get pan + double-tap-to-reset.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { PanResponder, type PanResponderInstance } from "react-native";

const FIT_PADDING_PX = 24;
const FIT_MIN_AVAILABLE_PX = 40;
const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface ContentSize {
  width: number;
  height: number;
}

interface ContainerSize {
  width: number;
  height: number;
}

interface PanZoomResult {
  transform: Transform | null;
  reset: () => void;
  /** Spread onto the pannable container's panHandlers. */
  panHandlers: PanResponderInstance["panHandlers"];
  /** Bind to the container's `onLayout` so fit + drag use real geometry. */
  onLayout: (e: { nativeEvent: { layout: ContainerSize } }) => void;
  isDragging: boolean;
}

function fitTransform(svg: ContentSize, box: ContainerSize): Transform {
  if (box.width <= 0 || box.height <= 0) return IDENTITY;
  const availableW = Math.max(FIT_MIN_AVAILABLE_PX, box.width - FIT_PADDING_PX * 2);
  const availableH = Math.max(FIT_MIN_AVAILABLE_PX, box.height - FIT_PADDING_PX * 2);
  const scale = Math.min(availableW / svg.width, availableH / svg.height);
  return {
    scale,
    x: FIT_PADDING_PX + (availableW - svg.width * scale) / 2,
    y: FIT_PADDING_PX + (availableH - svg.height * scale) / 2,
  };
}

/**
 * Hook that mirrors usePanZoom.web's surface for native callers. Returns
 * `panHandlers` to spread onto the container plus an `onLayout` callback
 * that captures viewport size for fit-to-container.
 */
export function usePanZoom(
  _containerRef: unknown,
  contentSize: ContentSize | null,
): PanZoomResult {
  const [transform, setTransform] = useState<Transform | null>(null);
  const containerSizeRef = useRef<ContainerSize | null>(null);
  const dragBaseRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const refit = useCallback((): void => {
    const box = containerSizeRef.current;
    if (!box || !contentSize) return;
    setTransform(fitTransform(contentSize, box));
  }, [contentSize]);

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: ContainerSize } }): void => {
      containerSizeRef.current = e.nativeEvent.layout;
      if (transform === null) refit();
    },
    [refit, transform],
  );

  const responder = useMemo<PanResponderInstance>(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          dragBaseRef.current = transform
            ? { x: transform.x, y: transform.y }
            : null;
        },
        onPanResponderMove: (_, gesture) => {
          const base = dragBaseRef.current;
          if (!base) return;
          setTransform((prev) =>
            prev
              ? { ...prev, x: base.x + gesture.dx, y: base.y + gesture.dy }
              : prev,
          );
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
          dragBaseRef.current = null;
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          dragBaseRef.current = null;
        },
      }),
    [transform],
  );

  return {
    transform,
    reset: refit,
    panHandlers: responder.panHandlers,
    onLayout,
    isDragging: isDraggingRef.current,
  };
}
