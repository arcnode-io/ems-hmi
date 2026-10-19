/**
 * AlarmBell — bell + active-alarm badge in the TopBar; pressing it opens the
 * alarms list.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { usePulseOpacity } from "../../../hooks/usePulseOpacity";
import { IconBell } from "../../icons";

const BELL_TARGET = 32;

export function AlarmBell({ alarmCount, onPress }: { alarmCount: number; onPress?: () => void }): React.ReactElement {
  const t = useTheme();
  // Reason: rule 3.2 — badge breathes 0.7↔1.0 over 800ms while alarms outstanding.
  const opacity = usePulseOpacity(alarmCount > 0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Alarms, ${alarmCount} active`}
      onPress={onPress}
      style={{
        position: "relative",
        width: BELL_TARGET,
        height: BELL_TARGET,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconBell size={20} color={t.textMid} />
      {alarmCount > 0 && (
        <View
          dataSet={{ region: "alarm-count" }}
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            borderRadius: 8,
            backgroundColor: t.statusAlarm,
            borderWidth: 1.5,
            borderColor: t.bg,
            alignItems: "center",
            justifyContent: "center",
            opacity,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: t.fontLabel,
              fontSize: 10,
              fontWeight: "700",
            }}
          >
            {alarmCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
