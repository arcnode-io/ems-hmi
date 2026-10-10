/**
 * UnlockControls — CommandPanel header affordance for the write-unlock guard:
 * an "Unlock controls" button while locked, a relock note while open, and
 * the reason instead of the button while the device is locked out (LOTO).
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { RADIUS } from "../../../theme/tokens/primitives";
import { RELOCK_MS } from "../../../hooks/useWriteUnlock";
import { IconPadlock } from "../../icons/IconPadlock";

interface UnlockControlsProps {
  unlocked: boolean;
  onUnlock: () => void;
  /** Device is LOTO'd — unlocking is unavailable. */
  lockedOut: boolean;
}

export function UnlockControls({ unlocked, onUnlock, lockedOut }: UnlockControlsProps): React.ReactElement {
  const t = useTheme();
  if (lockedOut) {
    return (
      <View dataSet={{ region: "unlock-unavailable" }} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <IconPadlock size={12} color={t.statusLoto} />
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.statusLoto }]}>Locked out — controls unavailable</Text>
      </View>
    );
  }
  return unlocked ? (
    <Text dataSet={{ region: "unlocked" }} style={[resolveTypeStyle(t, "caption"), { color: t.textMid }]}>
      {`Unlocked · relocks ${RELOCK_MS / 1000} s after the last command`}
    </Text>
  ) : (
    <Pressable
      accessibilityRole="button"
      dataSet={{ action: "unlock" }}
      onPress={onUnlock}
      style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS[2], borderWidth: 1, borderColor: t.border }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "600" }]}>Unlock controls</Text>
    </Pressable>
  );
}
