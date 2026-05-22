/**
 * SuggestionChips — empty-state prompts to give the operator a starting
 * point. Tap → sends the question. Rendered as full-width rows: the demo
 * questions are long, so a horizontal pill strip clipped them off-screen.
 *
 * Chips lead with questions the demo analyst-server actually answers:
 * historical + forecast DAM price (the forecasts table is demo-seeded),
 * query_markets / query_energy_breakdown, and listDevicesWhere. Live-ERCOT
 * prompts stay absent until the gridstatus quota resets (~2026-06-01).
 */

import React from "react";
import { View, Pressable, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Show me the day-ahead clearing price for market_01 over the last 24 hours",
  "Show me the DAM LMP price forecast for the next 24 hours",
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
    <View
      dataSet={{ comp: "SuggestionChips" }}
      style={{ gap: 6, paddingHorizontal: SPACE[4] }}
    >
      {suggestions.map((s) => (
        <Pressable
          key={s}
          accessibilityRole="button"
          onPress={(): void => onPick(s)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: SPACE[2],
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: RADIUS[2],
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { flex: 1, fontSize: 12, color: t.textMid, letterSpacing: 0.05 },
            ]}
          >
            {s}
          </Text>
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: "700" }}>
            →
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
