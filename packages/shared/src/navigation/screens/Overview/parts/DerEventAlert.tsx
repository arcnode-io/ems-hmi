/**
 * DerEventAlert — Overview alert row for an active utility DER curtailment
 * event. Renders nothing while quiet, so the screen can mount it
 * unconditionally. Alarm-weight — a curtailment in progress is as
 * operationally urgent as an active alarm.
 *
 * Demo-only data (MockDerEventProvider) — see data/der/derEvent.types.ts.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useDerEvent } from "../../../../data/der/useDerEvent";
import { useDerElapsedSeconds } from "../../../../data/der/useDerElapsedSeconds";
import { formatDerTarget } from "../../../../data/der/format";
import { formatCountdown } from "../../../../data/dispatch/format";

export function DerEventAlert(): React.ReactElement | null {
  const t = useTheme();
  const { eventActive, targetActivePowerW } = useDerEvent();
  const elapsedSec = useDerElapsedSeconds();

  if (!eventActive) return null;

  return (
    <View
      dataSet={{ comp: "DerEventAlert" }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[4],
        backgroundColor: `${t.statusAlarm}14`,
        borderWidth: 1,
        borderColor: t.statusAlarm,
        borderLeftWidth: 3,
        borderRadius: RADIUS[3],
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[3],
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: t.statusAlarm,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              color: t.statusAlarm,
              textTransform: "uppercase",
              fontWeight: "700",
              letterSpacing: 0.15,
            },
          ]}
        >
          Grid curtailment active
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textMid, marginTop: 2 },
          ]}
        >
          Utility commanded {formatDerTarget(targetActivePowerW)} ·{" "}
          {formatCountdown(elapsedSec)} elapsed
        </Text>
      </View>
    </View>
  );
}
