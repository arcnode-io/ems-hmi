/**
 * SuggestionChips — empty-state prompts to give the operator a starting
 * point. Tap → drops the text into the composer.
 */

import React from "react";
import { ScrollView, Pressable, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Show me BESS-01 SoC over the last 24h",
  "List active alarms",
  "What's today's market revenue?",
  "Show CDU outlet temps",
];

interface SuggestionChipsProps {
  suggestions?: readonly string[];
  onPick: (text: string) => void;
}

export function SuggestionChips({
  suggestions = DEFAULT_SUGGESTIONS,
  onPick,
}: SuggestionChipsProps): React.ReactElement {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: SPACE[4],
        gap: 6,
        paddingVertical: SPACE[2],
      }}
    >
      {suggestions.map((s) => (
        <Pressable
          key={s}
          accessibilityRole="button"
          onPress={(): void => onPick(s)}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: RADIUS.full,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            flexShrink: 0,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 11,
                color: t.textMid,
                letterSpacing: 0.05,
              },
            ]}
          >
            {s}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
