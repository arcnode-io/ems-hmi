/** Shared Analyst screen parts — empty state + error notice. */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { SuggestionChips, DEFAULT_SUGGESTIONS } from "./SuggestionChips";

/** Empty conversation — a prompt + the tappable suggestion rows. */
export function EmptyState({
  onPick,
}: {
  onPick: (text: string) => void;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ gap: SPACE[2], marginTop: SPACE[3] }}>
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textSoft, marginHorizontal: SPACE[4], textAlign: "center" },
        ]}
      >
        Try one of these to get started:
      </Text>
      <SuggestionChips suggestions={DEFAULT_SUGGESTIONS} onPick={onPick} />
    </View>
  );
}

/** Transport-level failure notice (a turn's error artifacts render inline). */
export function ErrorNotice({
  message,
}: {
  message: string;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        padding: SPACE[3],
        borderWidth: 1,
        borderColor: t.statusAlarm,
        borderRadius: RADIUS[2],
      }}
    >
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text }]}>
        Something went wrong — {message}
      </Text>
    </View>
  );
}
