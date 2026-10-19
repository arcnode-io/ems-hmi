/**
 * AlarmList — every active alarm on the site; a row opens the device that
 * raised it. An empty list reads "no active alarms" only when every
 * monitored reading has reported (constitution §3.4 — unknown is a state).
 * No Ack yet: there's no acknowledgement store to write to.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { AlarmRow } from "../../../../components/composed/AlarmRow/AlarmRow";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { SiteHealth } from "../../../../data/alarms/siteHealth";
import { healthLine } from "../../Overview/parts/healthLine";
import { relativeAge } from "../../Overview/parts/relativeAge";

interface AlarmListProps {
  alarms: readonly ActiveAlarm[];
  health: SiteHealth;
  onOpen: (deviceId: string) => void;
}

function EmptyState({ health }: { health: SiteHealth }): React.ReactElement {
  const t = useTheme();
  const text =
    health.level === "unknown"
      ? `No alarms raised, but site status is unknown: ${healthLine(health, 0).detail}.`
      : "No active alarms. Every monitored reading is within its limits.";
  return <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft, padding: SPACE[4] }]}>{text}</Text>;
}

export function AlarmList({ alarms, health, onOpen }: AlarmListProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "AlarmList" }}
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
      {alarms.length === 0 ? (
        <EmptyState health={health} />
      ) : (
        alarms.map((alarm) => (
          <Pressable
            key={`${alarm.deviceId}:${alarm.measurementName}`}
            accessibilityRole="link"
            accessibilityLabel={`${alarm.deviceDisplayName} · ${alarm.measurementLabel}`}
            onPress={(): void => onOpen(alarm.deviceId)}
          >
            <AlarmRow
              severity={alarm.severity}
              acknowledged={false}
              device={alarm.deviceDisplayName}
              name={alarm.measurementLabel}
              value={alarm.limitLabel === null ? alarm.displayValue : `${alarm.displayValue} · ${alarm.limitLabel}`}
              age={relativeAge(alarm.ts)}
              category={alarm.category}
            />
          </Pressable>
        ))
      )}
    </View>
  );
}
