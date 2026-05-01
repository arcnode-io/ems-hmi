import type { ComponentType, ReactElement, ReactNode } from "react";
import { TouchableOpacity } from "react-native";
import { styled, View, Text, useTheme } from "@tamagui/core";
import { match } from "ts-pattern";
import type { IconProps } from "@tamagui/helpers-icon";

/** Styled button container with theme-aware shadow and border. */
const ButtonBase = styled(View, {
  padding: "$sm",
  margin: "$xs",
  borderColor: "$borderColor",
  borderStyle: "solid",
  borderRadius: "$sm",
  cursor: "pointer",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: "$xs",

  variants: {
    elevated: {
      true: (_props, { theme }) => {
        const boxShadow =
          theme.buttonBoxShadow?.val ?? theme.buttonBoxShadow ?? "none";
        const themeBorderW =
          theme.cardBorderWidth?.val ?? theme.cardBorderWidth ?? 1;
        const borderW = Math.max(themeBorderW, 1);

        return {
          borderWidth: borderW,
          boxShadow: boxShadow,
        };
      },
    },
    color: {
      default: { backgroundColor: "$surface", color: "$color" },
      primary: { backgroundColor: "$primary", color: "$background" },
      secondary: { backgroundColor: "$secondary", color: "$background" },
      accent: { backgroundColor: "$accent", color: "$background" },
    },
  } as const,

  defaultVariants: {
    elevated: true,
    color: "primary",
  },
});

type ButtonColor = "default" | "primary" | "secondary" | "accent";

/**
 * Gets text color for button variant using pattern matching.
 * @param color - Button color variant.
 * @returns Tamagui color token.
 */
const getTextColor = (color: ButtonColor): string =>
  match(color)
    .with("default", () => "$color")
    .with("primary", "secondary", "accent", () => "$background")
    .exhaustive();

const ButtonText = styled(Text, {
  fontWeight: "500",
  fontSize: 16,
  fontFamily: "$body",
});

/** Icon component type compatible with @tamagui/lucide-icons */
type IconComponent = ComponentType<IconProps>;

const ICON_SIZE = 18;

interface ButtonProps {
  onPress?: () => void;
  color?: "default" | "primary" | "secondary" | "accent";
  elevated?: boolean;
  children?: ReactNode;
  /** Simple text label - preferred over children for automatic text styling */
  label?: string;
  /** Icon component to render before text */
  icon?: IconComponent;
  /** Icon component to render after text */
  iconAfter?: IconComponent;
}

/**
 * Gets icon color based on button variant using theme tokens.
 * @param color - Button color variant.
 * @param theme - Current theme object.
 * @returns Resolved color string for icon.
 */
const getIconColor = (
  color: ButtonColor,
  theme: ReturnType<typeof useTheme>,
): string =>
  match(color)
    .with("default", () => String(theme.color?.val ?? "#000"))
    .with("primary", "secondary", "accent", () =>
      String(theme.background?.val ?? "#fff"),
    )
    .exhaustive();

/**
 * Button with theme-aware styling and touch feedback.
 * Supports color variants: default (surface), primary, secondary, accent.
 * Use `label` prop for automatic text color contrast.
 * @param props - Button props including onPress handler and styling options.
 * @param props.onPress - Press handler callback.
 * @param props.color - Color variant.
 * @param props.elevated - Show shadow elevation.
 * @param props.children - Custom content.
 * @param props.label - Text label for button.
 * @param props.icon - Icon component to render before text.
 * @param props.iconAfter - Icon component to render after text.
 * @returns Themed button element.
 */
export function Button({
  onPress,
  color = "primary",
  elevated = true,
  children,
  label,
  icon: Icon,
  iconAfter: IconAfter,
}: ButtonProps): ReactElement {
  const theme = useTheme();
  const iconColor = getIconColor(color, theme);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ButtonBase color={color} elevated={elevated}>
        {Icon !== undefined && <Icon size={ICON_SIZE} color={iconColor} />}
        {label !== undefined && label !== "" ? (
          <ButtonText color={getTextColor(color)}>{label}</ButtonText>
        ) : (
          children
        )}
        {IconAfter !== undefined && (
          <IconAfter size={ICON_SIZE} color={iconColor} />
        )}
      </ButtonBase>
    </TouchableOpacity>
  );
}
