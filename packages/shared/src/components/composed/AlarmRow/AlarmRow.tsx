/**
 * AlarmRow — single row in active-alarm panel + history table.
 * Severity drives color + icon; unacknowledged adds left-border + pulse dot.
 * Per Rules 3.1 + 3.3: row bg never flashes; only the dot pulses.
 * See design-handoff/02-components/AlarmRow.md.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { usePulseOpacity } from "../../../hooks/usePulseOpacity";
import { IconAlarm } from "../../icons/IconAlarm";
import { IconWarning } from "../../icons/IconWarning";
import { IconFire } from "../../icons/IconFire";

export type AlarmSeverity = "warn" | "alarm" | "fire";

export interface AlarmRowProps {
  severity: AlarmSeverity;
  acknowledged: boolean;
  /** Canonical or DTM display name. */
  device: string;
  /** Humanized alarm name. */
  name: string;
  /** Pre-formatted measurement value (with unit). */
  value: string;
  /** Relative time, e.g. "4m ago". */
  age: string;
  /** Absent in Analyst (read-only). */
  onAcknowledge?: () => void;
  /**
   * Optional alarm-origin category tag (e.g. "UTILITY", "MAINTENANCE").
   * Renders as a small chip on the right beside the Ack button — never
   * replaces the device ID. Per constitution rule 3.12 the label is an
   * index; the diagnosis is in the runbook.
   */
  category?: string;
}

function severityColor(t: Theme, severity: AlarmSeverity): string {
  return match(severity)
    .with("fire", () => t.statusFire)
    .with("alarm", () => t.statusAlarm)
    .with("warn", () => t.statusWarn)
    .exhaustive();
}

function SeverityIcon({
  severity,
  color,
}: {
  severity: AlarmSeverity;
  color: string;
}): React.ReactElement {
  return match(severity)
    .with("fire", () => <IconFire size={16} color={color} />)
    .with("alarm", () => <IconAlarm size={16} color={color} />)
    .with("warn", () => <IconWarning size={16} color={color} />)
    .exhaustive();
}

/**
 * Render an alarm row. Acts as an alert when unacknowledged.
 * @param props AlarmRow props
 * @returns View element
 */
export function AlarmRow({
  severity,
  acknowledged,
  device,
  name,
  value,
  age,
  onAcknowledge,
  category,
}: AlarmRowProps): React.ReactElement {
  const t = useTheme();
  const sev = severityColor(t, severity);
  const unack = !acknowledged;
  // Reason: constitution rule 3.2 — breathe, never flash. Only the indicator
  // pulses; row bg + value remain readable.
  const dotOpacity = usePulseOpacity(unack);

  return (
    <View
      role={unack ? "alert" : undefined}
      dataSet={{
        comp: "AlarmRow",
        severity,
        acknowledged: acknowledged ? "true" : "false",
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[3],
        padding: SPACE[3],
        paddingLeft: unack ? SPACE[3] - 3 : SPACE[3],
        backgroundColor: t.surface,
        borderTopWidth: 1,
        borderTopColor: t.borderSoft,
        borderLeftWidth: unack ? 3 : 0,
        borderLeftColor: unack ? sev : "transparent",
      }}
    >
      <View
        style={{
          width: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {unack && (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: sev,
              opacity: dotOpacity,
            }}
          />
        )}
      </View>

      <SeverityIcon severity={severity} color={sev} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { color: t.text, fontWeight: "700", letterSpacing: 0.1 },
            ]}
          >
            {device}
          </Text>
          <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}>
            · {age}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}
        >
          {name} ·{" "}
          <Text style={{ color: t.text, fontWeight: "600" }}>{value}</Text>
        </Text>
      </View>

      {unack ? (
        <Pressable
          accessibilityLabel={`Acknowledge ${severity} alarm on ${device}`}
          onPress={onAcknowledge}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: RADIUS[2],
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: "transparent",
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                color: t.text,
                fontWeight: "700",
                letterSpacing: 0.15,
                textTransform: "uppercase",
              },
            ]}
          >
            Ack
          </Text>
        </Pressable>
      ) : (
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              color: t.textSoft,
              letterSpacing: 0.15,
              textTransform: "uppercase",
            },
          ]}
        >
          Ack&apos;d
        </Text>
      )}

      {category ? (
        <View
          dataSet={{ region: "category" }}
          style={{
            paddingVertical: 2,
            paddingHorizontal: 6,
            borderRadius: RADIUS[2],
            borderWidth: 1,
            borderColor: t.borderSoft,
            backgroundColor: "transparent",
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 8.5,
                fontWeight: "700",
                letterSpacing: 0.2,
                color: t.textSoft,
                textTransform: "uppercase",
              },
            ]}
          >
            {category}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
