/**
 * SuggestionChips — empty-state prompts to give the operator a starting
 * point. Tap → drops the text into the composer.
 *
 * Chips lead with questions the demo analyst-server actually answers:
 * path-1 historical market price (real demo CSV) + query_markets /
 * query_energy_breakdown (placeholder artifacts that still render) +
 * listDevicesWhere. Forecast + live-ERCOT prompts are deliberately
 * absent until the forecasts table + the ERCOT quota land (~2026-06-01).
 */

import React from "react";
import { ScrollView, Pressable, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Show me the day-ahead clearing price for market_01 over the last 24 hours",
  "List devices currently in alarm",
  "What was today's revenue by market?",
  "Break down today's energy consumption by source",
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
