/**
 * AnalystDesktop — the two-pane desktop layout: a left artifact canvas
 * (charts/tables/errors, newest at top) and a right conversation pane
 * (chat + live tool trace + composer). Header carries the intel cards.
 */

import React, { useEffect, useRef } from "react";
import { View, ScrollView, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { useAnalystConversation } from "../../../../data/analyst/useAnalystConversation";
import { useIntelFeed } from "../../../../data/analyst/intelFeed";
import { AgentToolCardRow } from "../../../../components/composed/IntelFeed/IntelFeed";
import type { IntelHeadline } from "../../../../data/analyst/intelFeed";
import { Composer } from "./Composer";
import { useRotatingPlaceholder } from "./useRotatingPlaceholder";
import { StreamItemView } from "./StreamItemView";
import { PendingTurnView } from "./PendingTurnView";
import { EmptyState, ErrorNotice } from "./AnalystShared";

const CHAT_PANE_WIDTH = 420;

function DesktopHeader({
  feed,
}: {
  feed: readonly IntelHeadline[];
}): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[4],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[4],
        borderBottomWidth: 1,
        borderBottomColor: t.border,
      }}
    >
      <View>
        <Text
          style={[
            resolveTypeStyle(t, "screenTitle"),
            {
              fontSize: 24,
              color: t.text,
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
          Conversational data · chat → charts
        </Text>
      </View>
      <View style={{ flex: 1, maxWidth: 760 }}>
        <AgentToolCardRow headlines={feed} />
      </View>
    </View>
  );
}

function CanvasEmpty(): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", marginTop: SPACE[6] }}>
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textSoft, textAlign: "center" },
        ]}
      >
        Charts and tables appear here as you ask.
      </Text>
    </View>
  );
}

export function AnalystDesktop(): React.ReactElement {
  const t = useTheme();
  const { items, pending, status, error, send, dismiss } =
    useAnalystConversation();
  const feed = useIntelFeed();
  const placeholder = useRotatingPlaceholder();
  const chatRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    chatRef.current?.scrollToEnd?.({ animated: true });
  }, [items.length, pending]);

  const artifacts = items.filter((i) => i.kind === "artifact");
  const messages = items.filter((i) => i.kind === "message");
  const chatEmpty = messages.length === 0 && pending === null;

  return (
    <View
      dataSet={{ comp: "AnalystScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <DesktopHeader feed={feed} />
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Left — artifact canvas, newest first */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: SPACE[4], gap: SPACE[4] }}
        >
          {artifacts.length === 0 ? (
            <CanvasEmpty />
          ) : (
            [...artifacts]
              .reverse()
              .map((a) => (
                <StreamItemView key={a.id} item={a} onDismiss={dismiss} />
              ))
          )}
        </ScrollView>

        {/* Right — conversation */}
        <View
          style={{
            width: CHAT_PANE_WIDTH,
            borderLeftWidth: 1,
            borderLeftColor: t.border,
          }}
        >
          <ScrollView
            ref={chatRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: SPACE[3], gap: SPACE[3] }}
          >
            {chatEmpty ? (
              <EmptyState onPick={send} />
            ) : (
              messages.map((m) => (
                <StreamItemView key={m.id} item={m} onDismiss={dismiss} />
              ))
            )}
            {pending ? <PendingTurnView pending={pending} /> : null}
            {status === "error" && error ? (
              <ErrorNotice message={error} />
            ) : null}
          </ScrollView>
          <Composer
            disabled={status === "streaming"}
            onSend={send}
            placeholder={placeholder}
          />
        </View>
      </View>
    </View>
  );
}
