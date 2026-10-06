/** Small pieces of the reserve control: its primary button and the cover-time wording. */

import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { RADIUS } from "../../../../theme/tokens/primitives";

/** Primary action — same accent fill + inverse label as the dialog's Send. */
export function PrimaryButton({ label, testID, onPress }: { label: string; testID: string; onPress: () => void }): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS[2], backgroundColor: t.accent }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: t.textInverse, fontWeight: "700" }]}>{label}</Text>
    </Pressable>
  );
}


/** "Covers ~3.0 h …" — hours of full curtailment before GPUs throttle, in plain time. */
export function coverLine(hours: number): string {
  if (hours <= 0) return "No cover — GPUs throttle as soon as a curtailment starts";
  const span = hours < 1 ? `~${Math.round(hours * 60)} min` : `~${hours.toFixed(1)} h`;
  return `Covers ${span} of full curtailment before GPUs throttle`;
}

