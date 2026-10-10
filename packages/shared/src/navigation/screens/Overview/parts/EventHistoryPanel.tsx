/**
 * EventHistoryPanel — Overview Zone D. What happened on site (DER events,
 * reserve and dispatch-mode changes), newest first, from der-control-api's
 * event log. Read-only: events are records, never acknowledged (Hollifield:
 * only alarms need action). Live alarms stay on the HealthBar count and the
 * BESS / Compute screens.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { EventHistory } from "../../../../data/events/useEventHistory";
import { eventLine } from "./eventLine";
import { relativeAge } from "./relativeAge";

// Reason: the card is a glance, not the log — the latest few tell the story.
const MAX_ROWS = 10;

interface EventHistoryPanelProps {
  history: EventHistory;
  /** BESS minimum SoC, MWh — reserve rows read above it, like the BESS tile. */
  floorMwh: number;
}

export function EventHistoryPanel({ history, floorMwh }: EventHistoryPanelProps): React.ReactElement {
  const t = useTheme();
  const lines =
    history.status === "ready"
      ? history.rows
          .map((row) => ({ id: row.id, text: eventLine(row, floorMwh), ts: row.occurredAt }))
          .filter((line): line is { id: number; text: string; ts: string } => line.text !== null)
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
      <View style={{ paddingVertical: SPACE[3], paddingHorizontal: SPACE[4] }}>
        <Text numberOfLines={1} style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          Event history · last 24 h
        </Text>
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
              flexDirection: "row",
              justifyContent: "space-between",
              gap: SPACE[3],
              paddingVertical: SPACE[2],
              paddingHorizontal: SPACE[4],
              borderTopWidth: 1,
              borderTopColor: t.borderSoft,
            }}
          >
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, flex: 1 }]}>{line.text}</Text>
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>{relativeAge(line.ts)}</Text>
          </View>
        ))
      )}
    </View>
  );
}
