import type { ReactElement } from "react";
import { styled, View } from "@tamagui/core";

const SkeletonBase = styled(View, {
  backgroundColor: "$borderColor",
  overflow: "hidden",

  variants: {
    variant: {
      text: {
        height: 16,
        borderRadius: "$sm",
        width: "100%",
      },
      circle: {
        borderRadius: 1000,
      },
      rect: {
        borderRadius: "$sm",
      },
    },
  } as const,

  defaultVariants: {
    variant: "rect",
  },
});

interface SkeletonProps {
  /** Shape variant */
  variant?: "text" | "circle" | "rect";
  /** Width (required for circle/rect) */
  width?: number | string;
  /** Height (required for circle/rect) */
  height?: number | string;
}

/**
 * Static skeleton placeholder without animation for Detox integration tests.
 * Reason: Animated.loop() blocks Detox synchronization indefinitely.
 * @param root0 - Component props.
 * @param root0.variant - Shape variant.
 * @param root0.width - Width in px or %.
 * @param root0.height - Height in px.
 * @returns Static skeleton element.
 */
export function Skeleton({
  variant = "rect",
  width,
  height,
}: SkeletonProps): ReactElement {
  return (
    <View style={{ opacity: 0.4 }}>
      <SkeletonBase variant={variant} width={width} height={height} />
    </View>
  );
}

export type { SkeletonProps };
