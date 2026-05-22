/**
 * PendingTurnView — the in-flight turn: the live tool trace as the agent
 * works, or a "thinking…" line before the first tool call streams in.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { LiveToolTrace } from "../../../../components/composed/ToolTrace/ToolTrace";
import type { PendingTurn } from "../../../../data/analyst/conversation.types";

export function PendingTurnView({
  pending,
}: {
  pending: PendingTurn;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "PendingTurnView" }}
      style={{ marginHorizontal: SPACE[4], gap: SPACE[2] }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 8.5,
            fontWeight: "800",
            letterSpacing: 0.2,
            color: t.textSoft,
            textTransform: "uppercase",
          },
        ]}
      >
        Analyst
      </Text>
      {pending.trace.length > 0 ? (
        <LiveToolTrace steps={pending.trace} />
      ) : (
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textSoft, fontStyle: "italic" },
          ]}
        >
          thinking…
        </Text>
      )}
    </View>
  );
}
