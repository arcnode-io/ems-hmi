import { styled, View } from "@tamagui/core";

/**
 * Card container with theme-aware styling.
 * Reads shadow, border, and background from current theme.
 * Uses RN 0.76+ boxShadow for cross-platform shadow support.
 */
export const Card = styled(View, {
  padding: "$md",
  margin: "$md",
  backgroundColor: "$surface",
  borderRadius: "$sm",
  borderColor: "$borderColor",
  borderStyle: "solid",

  variants: {
    elevated: {
      true: (_props, { theme }) => {
        const boxShadow =
          theme.cardBoxShadow?.val ?? theme.cardBoxShadow ?? "none";
        const borderW =
          theme.cardBorderWidth?.val ?? theme.cardBorderWidth ?? 0;

        return {
          borderWidth: borderW,
          boxShadow: boxShadow,
        };
      },
    },
  } as const,

  defaultVariants: {
    elevated: true,
  },
});
