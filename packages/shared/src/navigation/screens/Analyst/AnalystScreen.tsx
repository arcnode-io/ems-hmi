/**
 * AnalystScreen — `/analyst` route. Chat scrollback + composer. Each
 * assistant message can carry interleaved prose + artifacts (charts /
 * tables / errors). Backend is the local fixture in dev; swap to the
 * analyst-agent HTTP endpoint when reachable.
 *
 * v1 contract per [[project-analyst-architecture]]:
 *   - JSON-only (no SSE in v1; v1.1 follow-up)
 *   - 4 artifact kinds: line / bar / table / pie + error
 *   - Bubble holds prose only; chart artifacts render below
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { useAnalystChat } from "../../../data/analyst/useAnalystChat";
import { analystChat } from "../../../data/analyst/AnalystClient";
import type {
  AnalystChatRequest,
  AnalystMessage,
} from "../../../data/analyst/types";
import { useDeploymentIdentity } from "../../../data/deployment/useDeploymentIdentity";
import { ChatBubble } from "../../../components/composed/ChatBubble/ChatBubble";
import { ChartRenderer } from "../../../components/composed/ChartRenderer/ChartRenderer";
import { Composer } from "./parts/Composer";
import { SuggestionChips, DEFAULT_SUGGESTIONS } from "./parts/SuggestionChips";

function MessageBlock({ msg }: { msg: AnalystMessage }): React.ReactElement {
  // Reason: the bubble owns prose; artifacts render their own cards in the
  // flow below the bubble. One message can interleave multiple of either.
  const proseChunks: string[] = [];
  const artifacts: AnalystMessage["content"] = [];
  for (const piece of msg.content) {
    if (piece.type === "text") proseChunks.push(piece.text);
    else artifacts.push(piece);
  }
  const text = proseChunks.join("\n");
  return (
    <View style={{ gap: SPACE[2] }}>
      <ChatBubble role={msg.role} text={text} time={msg.timestamp} />
      {artifacts.map((art, i) =>
        art.type === "artifact" ? (
          <ChartRenderer key={i} artifact={art.artifact} />
        ) : null,
      )}
    </View>
  );
}

export function AnalystScreen(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const identity = useDeploymentIdentity();
  // Reason: bind the backend once per chatApiUri so the hook receives a
  // stable reference; the context carries the siteId so the server can
  // detect mid-conversation tenant drift (409 site_id_changed).
  const backend = useMemo(
    () => (req: AnalystChatRequest) => analystChat(identity.chatApiUri, req),
    [identity.chatApiUri],
  );
  const context = useMemo(
    () => ({ siteId: identity.siteId }),
    [identity.siteId],
  );
  const { messages, status, send } = useAnalystChat({ backend, context });
  const scrollRef = useRef<ScrollView | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  // Track seconds since the current "sending" turn started so the loading
  // bubble can surface a soft warning above 30s (Ollama runs can hit ~100s).
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (status !== "sending") {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(0);
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Auto-scroll on new message.
  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [messages.length, status]);

  // Allow SuggestionChips → composer text fill (chip taps send directly).
  useEffect(() => {
    if (pendingText !== null) {
      void send(pendingText);
      setPendingText(null);
    }
  }, [pendingText, send]);

  return (
    <View
      dataSet={{ comp: "AnalystScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      {/* Header strip */}
      <View
        style={{
          marginTop: SPACE[3],
          marginHorizontal: SPACE[4],
          marginBottom: SPACE[2],
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: SPACE[2],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[
              resolveTypeStyle(t, "screenTitle"),
              {
                fontSize: 22,
                color: t.text,
                lineHeight: 22,
                letterSpacing: isSov ? 0.5 : 0,
                ...(isSov ? { textTransform: "uppercase" } : null),
              },
            ]}
          >
            {isSov ? "ANALYST" : "Analyst"}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                letterSpacing: 0.2,
                color: t.textSoft,
                textTransform: "uppercase",
                marginTop: 2,
              },
            ]}
          >
            Ask about devices · alarms · energy
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingVertical: SPACE[3],
          gap: SPACE[3],
        }}
      >
        {messages.length === 0 ? (
          <View style={{ gap: SPACE[2], marginTop: SPACE[3] }}>
            <Text
              style={[
                resolveTypeStyle(t, "bodyDense"),
                {
                  color: t.textSoft,
                  marginHorizontal: SPACE[4],
                  textAlign: "center",
                },
              ]}
            >
              Try one of these to get started:
            </Text>
            <SuggestionChips
              suggestions={DEFAULT_SUGGESTIONS}
              onPick={setPendingText}
            />
          </View>
        ) : (
          messages.map((msg, i) => <MessageBlock key={i} msg={msg} />)
        )}
        {status === "sending" ? (
          <ChatBubble role="loading" time={new Date().toISOString()} elapsedSec={elapsedSec} />
        ) : null}
      </ScrollView>

      <Composer disabled={status === "sending"} onSend={send} />
    </View>
  );
}
