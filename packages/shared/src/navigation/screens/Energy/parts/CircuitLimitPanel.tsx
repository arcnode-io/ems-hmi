/**
 * CircuitLimitPanel — distribution circuit export-limit status. Second
 * Grid Events feed, alongside DerControlPanel — a local interconnection
 * constraint, not a utility DERControl dispatch. Demo-only, no real
 * backend (fires on Alt+Shift+C — see MockDerEventProvider). Exists so
 * "Grid Events" reads as a genuine feed, not DER Control under a second
 * label. See data/der/derEvent.types.ts.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { EDPanel } from "./EDPanel";
import { useCircuitLimitEvent } from "../../../../data/der/useCircuitLimitEvent";
import { useCircuitLimitElapsedSeconds } from "../../../../data/der/useCircuitLimitElapsedSeconds";
import { formatExportCap } from "../../../../data/der/format";
import { formatCountdown } from "../../../../data/dispatch/format";

function Kv({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 9,
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
            fontWeight: "600",
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 10, color: t.text, fontWeight: "700" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function CircuitLimitPanel(): React.ReactElement {
  const t = useTheme();
  const { eventActive, exportCapW } = useCircuitLimitEvent();
  const elapsedSec = useCircuitLimitElapsedSeconds();

  return (
    <EDPanel accent={eventActive ? t.statusWarn : undefined}>
      <View style={{ padding: SPACE[3], gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: eventActive ? t.statusWarn : t.textFaint,
            }}
          />
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.2,
                textTransform: "uppercase",
                color: eventActive ? t.statusWarn : t.textMid,
              },
            ]}
          >
            {eventActive
              ? "Circuit export limit active"
              : "Circuit export limit — armed"}
          </Text>
        </View>

        {eventActive ? (
          <>
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                { fontSize: 11, color: t.text, fontWeight: "600" },
              ]}
            >
              Distribution operator capped export at{" "}
              {formatExportCap(exportCapW)} — {formatCountdown(elapsedSec)}{" "}
              elapsed
            </Text>
            <View
              style={{
                paddingTop: 6,
                borderTopWidth: 1,
                borderTopColor: t.borderSoft,
              }}
            >
              <Kv label="reason" value="local circuit capacity" />
            </View>
          </>
        ) : (
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 10, color: t.textSoft },
            ]}
          >
            No active export constraint from the local interconnection
          </Text>
        )}
      </View>
    </EDPanel>
  );
}
