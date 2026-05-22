/**
 * AnalystMobile — the phone layout: one inline stream of chat messages +
 * artifact cards, intel headline strip, live tool trace, bottom composer.
 */

import React, { useEffect, useRef } from "react";
import { View, ScrollView, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { useAnalystConversation } from "../../../../data/analyst/useAnalystConversation";
import { useIntelFeed } from "../../../../data/analyst/intelFeed";
import { HeadlineStrip } from "../../../../components/composed/IntelFeed/IntelFeed";
import { Composer } from "./Composer";
import { useRotatingPlaceholder } from "./useRotatingPlaceholder";
import { StreamItemView } from "./StreamItemView";
import { PendingTurnView } from "./PendingTurnView";
import { EmptyState, ErrorNotice } from "./AnalystShared";

function Header(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  return (
    <View
      style={{
        marginTop: SPACE[3],
        marginHorizontal: SPACE[4],
        marginBottom: SPACE[2],
      }}
    >
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
        Chat · charts · tables
      </Text>
    </View>
  );
}

export function AnalystMobile(): React.ReactElement {
  const t = useTheme();
  const { items, pending, status, error, send, dismiss } =
    useAnalystConversation();
  const feed = useIntelFeed();
  const placeholder = useRotatingPlaceholder();
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [items.length, pending]);

  const empty = items.length === 0 && pending === null;

  return (
    <View
      dataSet={{ comp: "AnalystScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <Header />
      <HeadlineStrip headlines={feed} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: SPACE[3], gap: SPACE[3] }}
      >
        {empty ? (
          <EmptyState onPick={send} />
        ) : (
          items.map((item) => (
            <StreamItemView key={item.id} item={item} onDismiss={dismiss} />
          ))
        )}
        {pending ? <PendingTurnView pending={pending} /> : null}
        {status === "error" && error ? <ErrorNotice message={error} /> : null}
      </ScrollView>
      <Composer
        disabled={status === "streaming"}
        onSend={send}
        placeholder={placeholder}
      />
    </View>
  );
}
