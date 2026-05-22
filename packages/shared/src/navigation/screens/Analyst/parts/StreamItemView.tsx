/**
 * StreamItemView — renders one ConversationItem: a chat bubble for a message
 * (with the collapsed tool trace under an assistant turn), or an artifact
 * card. Shared by the mobile + desktop Analyst screens.
 */

import React from "react";
import { View } from "react-native";
import { SPACE } from "../../../../theme/tokens/primitives";
import { ChatBubble } from "../../../../components/composed/ChatBubble/ChatBubble";
import { ChartRenderer } from "../../../../components/composed/ChartRenderer/ChartRenderer";
import { CompletedToolTrace } from "../../../../components/composed/ToolTrace/ToolTrace";
import type { ConversationItem } from "../../../../data/analyst/conversation.types";

export interface StreamItemViewProps {
  item: ConversationItem;
  onDismiss: (id: string) => void;
}

export function StreamItemView({
  item,
  onDismiss,
}: StreamItemViewProps): React.ReactElement {
  if (item.kind === "artifact") {
    return (
      <ChartRenderer
        artifact={item.artifact}
        onDismiss={() => onDismiss(item.id)}
      />
    );
  }
  const hasTrace =
    item.role === "assistant" && item.trace !== undefined && item.trace.length > 0;
  return (
    <View style={{ gap: SPACE[2] }}>
      <ChatBubble role={item.role} text={item.text} time={item.timestamp} />
      {hasTrace ? (
        <View style={{ marginHorizontal: SPACE[4] }}>
          <CompletedToolTrace trace={item.trace ?? []} />
        </View>
      ) : null}
    </View>
  );
}
