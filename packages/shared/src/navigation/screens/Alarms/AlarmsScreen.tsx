/**
 * AlarmsScreen — `/alarms`: every active alarm on the site, where the bell,
 * the status strip's SITE cell and Overview's health bar all lead.
 */

import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { useAlarms } from "../../../data/alarms/useAlarms";
import { useSiteHealth } from "../../../data/alarms/useSiteHealth";
import { AlarmList } from "./parts/AlarmList";

export function AlarmsScreen({ onOpen }: { onOpen: (deviceId: string) => void }): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const alarms = useAlarms();
  const health = useSiteHealth();
  return (
    <ScrollView
      dataSet={{ comp: "AlarmsScreen" }}
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
          {isSov ? "ALARMS" : "Alarms"}
        </Text>
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, marginTop: SPACE[1] }]}>
          Open a row to see the device that raised it.
        </Text>
      </View>
      <AlarmList alarms={alarms} health={health} onOpen={onOpen} />
    </ScrollView>
  );
}
