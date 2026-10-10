/**
 * EventLogTable — the event history page's log: one 38 px row per event
 * (absolute time · who · what), newest first, read-only. Rows that another row
 * already says (eventLine → null) are skipped, same as the Overview card.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SIZE, SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { EventRow } from "../../../../data/events/eventsApi";
import { eventLine, eventSource } from "../../Overview/parts/eventLine";
import { eventTime } from "./eventTime";
import { useBreakpoint } from "../../../../hooks/useBreakpoint";

interface EventLogTableProps {
  /** Loaded rows, newest first. */
  rows: EventRow[];
  /** BESS minimum SoC, MWh — reserve rows read above it. */
  floorMwh: number;
  /** True once an older page came back empty. */
  end: boolean;
  loadingOlder: boolean;
  onOlder: () => void;
}

export function EventLogTable({ rows, floorMwh, end, loadingOlder, onOlder }: EventLogTableProps): React.ReactElement {
  const t = useTheme();
  const cell = resolveTypeStyle(t, "bodyDense");
  // Reason: three columns don't fit a phone — stack "time · who" over "what", like the Overview card.
  const stacked = useBreakpoint().layout === "phone";
  return (
    <View>
      {rows.map((row) => {
        const text = eventLine(row, floorMwh);
        return text === null ? null : (
          <View
            key={row.id}
            dataSet={{ comp: "EventLogRow" }}
            style={{
              minHeight: SIZE.tableRow,
              flexDirection: stacked ? "column" : "row",
              alignItems: stacked ? "flex-start" : "center",
              columnGap: SPACE[4],
              paddingVertical: stacked ? SPACE[2] : 0,
              paddingHorizontal: SPACE[4],
              borderTopWidth: 1,
              borderTopColor: t.borderSoft,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", columnGap: SPACE[4] }}>
              <Text dataSet={{ region: "time" }} style={[resolveTypeStyle(t, "monoData"), { color: t.textMid, width: 128 }]}>
                {eventTime(row.occurredAt)}
              </Text>
              <Text dataSet={{ region: "source" }} style={[cell, { color: t.text, fontWeight: "700", width: 72 }]}>
                {eventSource(row)}
              </Text>
            </View>
            <Text dataSet={{ region: "event" }} style={[cell, { color: t.text, flex: stacked ? undefined : 1 }]}>
              {text}
            </Text>
          </View>
        );
      })}
      <View style={{ padding: SPACE[4], alignItems: "center", borderTopWidth: 1, borderTopColor: t.borderSoft }}>
        {end ? (
          <Text style={[cell, { color: t.textSoft }]}>Start of the log for these filters.</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={loadingOlder}
            onPress={onOlder}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: RADIUS[2],
              borderWidth: 1,
              borderColor: t.border,
              opacity: loadingOlder ? 0.5 : 1,
            }}
          >
            <Text style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "600" }]}>
              {loadingOlder ? "Loading…" : "Load older events"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
