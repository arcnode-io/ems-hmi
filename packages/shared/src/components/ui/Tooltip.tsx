import type { ReactElement, ReactNode } from "react";
import { Tooltip as TamaguiTooltip } from "@tamagui/tooltip";
import { Text } from "@tamagui/core";

interface TooltipProps {
  /** Content to show in tooltip */
  content: string;
  /** Element that triggers the tooltip on hover/press */
  children: ReactNode;
}

/**
 * Tooltip that shows on hover/long-press.
 * @param root0 - Component props.
 * @param root0.content - Tooltip text.
 * @param root0.children - Trigger element.
 * @returns Tooltip element.
 */
export function Tooltip({ content, children }: TooltipProps): ReactElement {
  return (
    <TamaguiTooltip delay={300}>
      <TamaguiTooltip.Trigger>{children}</TamaguiTooltip.Trigger>
      <TamaguiTooltip.Content
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$sm"
        paddingHorizontal="$sm"
        paddingVertical="$xs"
      >
        <TamaguiTooltip.Arrow
          backgroundColor="$surface"
          borderColor="$borderColor"
        />
        <Text color="$color" fontSize={14}>
          {content}
        </Text>
      </TamaguiTooltip.Content>
    </TamaguiTooltip>
  );
}

export type { TooltipProps };
