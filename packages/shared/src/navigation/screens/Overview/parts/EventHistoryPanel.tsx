/**
 * EventHistoryPanel — Overview Zone D, laid out like the alarms card it
 * replaced: the latest few events (DER lifecycle, reserve and dispatch-mode
 * changes) and a History link to the full log. Read-only: events are records,
 * never acknowledged (Hollifield: only alarms need action). Live alarms stay on
 * the HealthBar count and the BESS / Compute screens.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { EventHistory } from "../../../../data/events/useEventHistory";
import { eventLine, eventSource } from "./eventLine";
import { relativeAge } from "./relativeAge";

// Reason: the card is a glance, not the log — the latest few tell the story.
const MAX_ROWS = 5;

interface EventLine {
  id: number;
  text: string;
  source: ReturnType<typeof eventSource>;
  ts: string;
}

interface EventHistoryPanelProps {
  history: EventHistory;
  /** BESS minimum SoC, MWh — reserve rows read above it, like the BESS tile. */
  floorMwh: number;
  /** Open the full event history page. */
  onOpenHistory: () => void;
}

export function EventHistoryPanel({ history, floorMwh, onOpenHistory }: EventHistoryPanelProps): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const lines =
    history.status === "ready"
      ? history.rows
          .map((row) => ({ id: row.id, text: eventLine(row, floorMwh), source: eventSource(row), ts: row.occurredAt }))
          .filter((line): line is EventLine => line.text !== null)
          .slice(0, MAX_ROWS)
      : [];
  const empty = match(history)
    .with({ status: "ready" }, () => "No events in the last 24 h.")
    .with({ status: "loading" }, () => "Loading event history…")
    .with({ status: "unavailable" }, () => "Event history is available on a live site.")
    .with({ status: "error" }, () => "Couldn't load event history.")
    .exhaustive();

  return (
    <View
      dataSet={{ comp: "EventHistoryPanel" }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingVertical: SPACE[3],
          paddingHorizontal: SPACE[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACE[3],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
            Recent events · last 24 h
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "cardHeading"),
              {
                color: t.text,
                marginTop: 3,
                ...(isSov ? { textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "400" } : null),
              },
            ]}
          >
            Operations
          </Text>
        </View>
        <Pressable accessibilityRole="link" accessibilityLabel="View event history" onPress={onOpenHistory}>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { color: t.accent, fontWeight: "600", letterSpacing: 0.15, textTransform: "uppercase" },
            ]}
          >
            History →
          </Text>
        </Pressable>
      </View>
      {lines.length === 0 ? (
        <View
          style={{
            paddingVertical: SPACE[4],
            paddingHorizontal: SPACE[4],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          }}
        >
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>{empty}</Text>
        </View>
      ) : (
        lines.map((line) => (
          <View
            key={line.id}
            dataSet={{ comp: "EventRow" }}
            style={{
              padding: SPACE[3],
              paddingLeft: SPACE[4],
              backgroundColor: t.surface,
              borderTopWidth: 1,
              borderTopColor: t.borderSoft,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text
                dataSet={{ region: "source" }}
                style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "700", letterSpacing: 0.1 }]}
              >
                {line.source}
              </Text>
              <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}>· {relativeAge(line.ts)}</Text>
            </View>
            <Text numberOfLines={1} style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}>
              {line.text}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
