/**
 * LotoChip — padlock + "LOTO" in statusLoto. A STATE marker, not an alarm:
 * no ack, no breathe, sits beside (never replaces) the alarm StatusBadge.
 * Same visual on the module card and the device detail header.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { RADIUS } from "../../../theme/tokens/primitives";
import { IconPadlock } from "../../icons/IconPadlock";

interface LotoChipProps {
  /** Active locks held on this device itself; 0 when locked via a parent. */
  lockCount: number;
}

export function LotoChip({ lockCount }: LotoChipProps): React.ReactElement {
  const t = useTheme();
  const many = lockCount > 1;
  return (
    <View
      dataSet={{ comp: "LotoChip" }}
      accessibilityLabel={many ? `Locked out, ${lockCount} locks` : "Locked out"}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        height: 18,
        paddingHorizontal: 6,
        borderRadius: RADIUS[2],
        borderWidth: 1,
        borderColor: `${t.statusLoto}55`,
        backgroundColor: `${t.statusLoto}18`,
      }}
    >
      <IconPadlock size={12} color={t.statusLoto} />
      <Text style={[resolveTypeStyle(t, "label"), { fontSize: 9, fontWeight: "700", letterSpacing: 0.4, color: t.statusLoto }]}>
        {many ? `LOTO ×${lockCount}` : "LOTO"}
      </Text>
    </View>
  );
}
