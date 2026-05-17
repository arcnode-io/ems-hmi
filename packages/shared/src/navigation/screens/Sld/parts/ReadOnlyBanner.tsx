/**
 * ReadOnlyBanner — Sld screen sub-strip below BadgeStrip. Reinforces that
 * the SLD displays state only; commanding happens on the module detail
 * screen. Per constitution rule 3.1 — every command goes through
 * ConfirmationModal, never an inline button on a multi-device surface.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { IconPadlock } from "../../../../components/icons/IconPadlock";

export function ReadOnlyBanner(): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[4],
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        backgroundColor: t.bg,
        flexShrink: 0,
      }}
    >
      <IconPadlock size={11} color={t.textSoft} />
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 9,
            fontWeight: "600",
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
          },
        ]}
      >
        Read-only · open module to control
      </Text>
      <View style={{ flex: 1 }} />
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 9,
            fontWeight: "600",
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
          },
        ]}
      >
        + charge / − discharge
      </Text>
    </View>
  );
}
