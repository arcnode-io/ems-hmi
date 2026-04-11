import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { Animated, Easing } from "react-native";
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
 * Skeleton placeholder with pulse animation.
 * @param root0 - Component props.
 * @param root0.variant - Shape variant.
 * @param root0.width - Width in px or %.
 * @param root0.height - Height in px.
 * @returns Skeleton element.
 */
export function Skeleton({
  variant = "rect",
  width,
  height,
}: SkeletonProps): ReactElement {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return (): void => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <SkeletonBase variant={variant} width={width} height={height} />
    </Animated.View>
  );
}

export type { SkeletonProps };
