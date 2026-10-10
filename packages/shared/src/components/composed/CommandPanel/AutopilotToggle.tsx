import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useDispatch } from "../../../data/dispatch/useDispatch";

interface AutopilotToggleProps {
  /** Write-unlock guard is closed. */
  disabled: boolean;
  /** Fires after the toggle flips — counts as a write. */
  onToggle: () => void;
}

/**
 * AutopilotToggle — turns on auto-confirm of the standing proposal. A
 * control (desk console only, constitution 3.1). SIM affordances stay:
 * every auto-dispatch still runs through the simulated lifecycle + banner.
 */
export function AutopilotToggle({ disabled, onToggle }: AutopilotToggleProps): React.ReactElement {
  const t = useTheme();
  const { autopilotOn, setAutopilot } = useDispatch();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: autopilotOn, disabled }}
      accessibilityLabel="Autopilot"
      testID="autopilot-toggle"
      dataSet={{ action: "autopilot", on: String(autopilotOn) }}
      disabled={disabled}
      onPress={() => {
        setAutopilot(!autopilotOn);
        onToggle();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
        alignSelf: "flex-start",
        paddingVertical: 5,
        paddingHorizontal: 9,
        borderRadius: RADIUS[2],
        borderWidth: 1,
        borderColor: autopilotOn ? t.colorBess : t.border,
        backgroundColor: autopilotOn ? `${t.colorBess}18` : "transparent",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          backgroundColor: autopilotOn ? t.colorBess : t.textFaint,
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
            color: autopilotOn ? t.colorBess : t.textMid,
          },
        ]}
      >
        Autopilot {autopilotOn ? "On" : "Off"}
      </Text>
    </Pressable>
  );
}
