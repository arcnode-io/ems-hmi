/**
 * Mode — dot + humanized enum label. Tier-0 primitive. Maps AsyncAPI `type: enum`.
 * See handoff/02-components/Mode.md.
 *
 * Severity drives dot color (from class YAML x-severity). Label is the
 * humanized enum value (canonical name → title case, acronyms preserved).
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";

export type ModeSeverity = "ok" | "warn" | "alarm" | null;

export interface ModeProps {
  value: string | null;
  severity?: ModeSeverity;
}

const KNOWN_ACRONYMS = new Set(["BMS", "BESS", "GPU", "CDU", "AC", "DC", "POI", "PCS"]);

/**
 * Humanize a canonical enum value: strip underscores, title-case, preserve acronyms.
 * @param value Canonical enum value, e.g. "discharging" or "bms_fault"
 * @returns Human-readable label, e.g. "Discharging" or "BMS Fault"
 */
function humanize(value: string): string {
  return value
    .split("_")
    .map((part) => {
      const upper = part.toUpperCase();
      if (KNOWN_ACRONYMS.has(upper)) return upper;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Render an enum value as a dot + label.
 * @param props Mode props
 * @returns View element
 */
export function Mode({
  value,
  severity = null,
}: ModeProps): React.ReactElement {
  const t = useTheme();
  const isNoData = value === null;

  const dotColor = match(severity)
    .with("ok", () => t.statusOk)
    .with("warn", () => t.statusWarn)
    .with("alarm", () => t.statusAlarm)
    .with(null, () => t.textSoft)
    .exhaustive();

  const dataState = isNoData ? "no-data" : (severity ?? "neutral");

  return (
    <View
      dataSet={{ comp: "Mode", state: dataState }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {!isNoData && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor,
          }}
        />
      )}
      <Text style={[resolveTypeStyle(t, "label"), { color: t.text }]}>
        {isNoData ? "—" : humanize(value)}
      </Text>
    </View>
  );
}
