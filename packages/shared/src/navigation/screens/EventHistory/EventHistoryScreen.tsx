/**
 * EventHistoryScreen — the full event log behind Overview's History link:
 * server-side filters (kind, program, range), newest first, paged by a stable
 * id cursor, live new rows at the top. Read-only — events are never acked.
 * Retention comes from der-control-api, never a number baked in here.
 */

import React, { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { useEventLog } from "../../../data/events/useEventLog";
import { DEFAULT_FILTER, type EventFilter } from "../../../data/events/eventFilter";
import { EventFilters } from "./parts/EventFilters";
import { EventLogTable } from "./parts/EventLogTable";

export function EventHistoryScreen(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const { view } = useTopologyView();
  const [filter, setFilter] = useState<EventFilter>(DEFAULT_FILTER);
  const log = useEventLog(filter);
  const message = match(log)
    .with({ status: "ready" }, () => null)
    .with({ status: "loading" }, () => "Loading event history…")
    .with({ status: "unavailable" }, () => "Event history is available on a live site.")
    .with({ status: "error" }, () => "Couldn't load event history. It retries every few seconds.")
    .exhaustive();
  const body = resolveTypeStyle(t, "bodyDense");

  return (
    <ScrollView
      dataSet={{ comp: "EventHistoryScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[5] }}
    >
      <View style={{ marginTop: SPACE[3], marginHorizontal: SPACE[4] }}>
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
          {isSov ? "EVENT HISTORY" : "Event history"}
        </Text>
        {log.retentionDays === null ? null : (
          <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, marginTop: SPACE[1] }]}>
            {`Events are kept for ${log.retentionDays} days.`}
          </Text>
        )}
      </View>
      <EventFilters filter={filter} onChange={setFilter} />
      <View
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
        {log.status === "ready" ? (
          log.rows.length === 0 ? (
            <Text style={[body, { color: t.textSoft, padding: SPACE[4] }]}>No events match these filters.</Text>
          ) : (
            <EventLogTable
              rows={log.rows}
              floorMwh={view?.bess?.reserve_floor_mwh ?? 0}
              end={log.end}
              loadingOlder={log.loadingOlder}
              onOlder={log.loadOlder}
            />
          )
        ) : (
          <Text style={[body, { color: t.textSoft, padding: SPACE[4] }]}>{message}</Text>
        )}
      </View>
    </ScrollView>
  );
}
