/**
 * AlarmsPanel — Overview Zone D. Active alarms list driven by useAlarms().
 * Per constitution rule 1, sim mode never alarms — so this panel renders an
 * empty state in local/demo. Once a beta deployment delivers real values
 * outside thresholds, rows appear automatically via AlarmRow.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { AlarmRow } from "../../../../components/composed/AlarmRow/AlarmRow";
import { useAlarms } from "../../../../data/alarms/useAlarms";

/** Format a Unix-ms-ish ISO timestamp to a coarse "Nm ago" / "Nh Mm ago". */
function relativeAge(isoTs: string): string {
  const then = Date.parse(isoTs);
  if (!Number.isFinite(then)) return "just now";
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 90) return `${Math.round(seconds)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMin = Math.round(minutes - hours * 60);
  return `${hours}h ${remMin.toString().padStart(2, "0")}m ago`;
}

export function AlarmsPanel(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const alarms = useAlarms();
  const unackCount = alarms.length;

  return (
    <View
      dataSet={{ comp: "AlarmsPanel" }}
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
          <Text
            numberOfLines={1}
            style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}
          >
            Active alarms · {unackCount} unacknowledged
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "cardHeading"),
              {
                color: t.text,
                marginTop: 3,
                ...(isSov
                  ? {
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontWeight: "400",
                    }
                  : null),
              },
            ]}
          >
            Operations
          </Text>
        </View>
        <Pressable accessibilityRole="link" accessibilityLabel="View alarm history">
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                color: t.accent,
                fontWeight: "600",
                letterSpacing: 0.15,
                textTransform: "uppercase",
              },
            ]}
          >
            History →
          </Text>
        </Pressable>
      </View>

      {alarms.length === 0 ? (
        <View
          style={{
            paddingVertical: SPACE[4],
            paddingHorizontal: SPACE[4],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          }}
        >
          <Text
            style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}
          >
            No active alarms. All measurements within nominal envelope.
          </Text>
        </View>
      ) : (
        alarms.map((a) => (
          <AlarmRow
            key={`${a.deviceId}:${a.measurementName}`}
            severity={a.severity}
            acknowledged={false}
            device={a.deviceDisplayName}
            name={a.measurementLabel}
            value={a.displayValue}
            category={a.category}
            age={relativeAge(a.ts)}
          />
        ))
      )}
    </View>
  );
}
