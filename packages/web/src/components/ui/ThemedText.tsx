import type { ReactElement, ReactNode } from "react";
import { Text } from "@tamagui/core";
import type { TextProps, FontTokens } from "@tamagui/core";
import { useCurrentTheme } from "../../theme";

interface ThemedTextProps extends Omit<TextProps, "fontFamily"> {
  children: ReactNode;
}

/**
 * Text component that uses the current theme's fontFamily.
 * Automatically switches fonts when theme changes.
 * @param props - Text props with children content.
 * @param props.children - Text content to render.
 * @returns Themed Text element with current theme font.
 */
export function ThemedText({
  children,
  ...props
}: ThemedTextProps): ReactElement {
  const theme = useCurrentTheme();

  return (
    <Text fontFamily={theme.fontFamily as FontTokens} {...props}>
      {children}
    </Text>
  );
}
