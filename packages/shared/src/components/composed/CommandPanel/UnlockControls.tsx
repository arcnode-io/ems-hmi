/**
 * UnlockControls — CommandPanel header affordance for the write-unlock guard:
 * an "Unlock controls" button while locked, a relock note while open.
 */

import React from "react";
import { Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { RADIUS } from "../../../theme/tokens/primitives";
import { RELOCK_MS } from "../../../hooks/useWriteUnlock";

interface UnlockControlsProps {
  unlocked: boolean;
  onUnlock: () => void;
}

export function UnlockControls({ unlocked, onUnlock }: UnlockControlsProps): React.ReactElement {
  const t = useTheme();
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
