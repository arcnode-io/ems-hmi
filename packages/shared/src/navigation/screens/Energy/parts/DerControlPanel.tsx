/**
 * DerControlPanel — utility DER-control (curtailment) status. Always
 * present: a quiet "armed" state, or the active event's commanded target +
 * energize permission + EMS command-vs-actual tracking.
 *
 * Demo-only data (MockDerEventProvider) — swaps to real useSubscription
 * calls against the der_dispatch channels once ems-device-api's AsyncAPI
 * generator emits them. See data/der/derEvent.types.ts.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { EDPanel } from "./EDPanel";
import { useDerEvent } from "../../../../data/der/useDerEvent";
import { useDerElapsedSeconds } from "../../../../data/der/useDerElapsedSeconds";
import {
  formatDerTarget,
  isTrackingCommand,
} from "../../../../data/der/format";
import { formatCountdown } from "../../../../data/dispatch/format";
import { useOperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";

function Kv({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
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
          { fontSize: 10, color: color ?? t.text, fontWeight: "700" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function DerControlPanel(): React.ReactElement {
  const t = useTheme();
  const { eventActive, targetActivePowerW, energizeEnabled } = useDerEvent();
  const elapsedSec = useDerElapsedSeconds();
  const envelope = useOperatingEnvelope();
  const tracking = isTrackingCommand(
    targetActivePowerW,
    envelope.netActivePowerW,
  );

  return (
    <EDPanel accent={eventActive ? t.statusAlarm : undefined}>
      <View style={{ padding: SPACE[3], gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: eventActive ? t.statusAlarm : t.textFaint,
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
                color: eventActive ? t.statusAlarm : t.textMid,
              },
            ]}
          >
            {eventActive ? "Grid curtailment active" : "DER control — armed"}
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
              Utility commanded {formatDerTarget(targetActivePowerW)} —{" "}
              {formatCountdown(elapsedSec)} elapsed
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 14,
                paddingTop: 6,
                borderTopWidth: 1,
                borderTopColor: t.borderSoft,
                flexWrap: "wrap",
              }}
            >
              <Kv
                label="energize"
                value={energizeEnabled ? "permitted" : "blocked"}
                color={energizeEnabled ? t.statusOk : t.statusAlarm}
              />
              <Kv
                label="ems response"
                value={tracking ? "tracking ✓" : "not tracking"}
                color={tracking ? t.statusOk : t.statusWarn}
              />
            </View>
          </>
        ) : (
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 10, color: t.textSoft },
            ]}
          >
            Energize {energizeEnabled ? "permitted" : "blocked"} · no active
            grid event
          </Text>
        )}
      </View>
    </EDPanel>
  );
}
