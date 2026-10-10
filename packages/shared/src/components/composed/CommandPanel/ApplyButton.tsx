/** ApplyButton — CommandPanel's primary action; opens ConfirmationModal, never dispatches itself. */

import React from "react";
import { Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

interface ApplyButtonProps {
  disabled: boolean;
  onPress: () => void;
}

export function ApplyButton({ disabled, onPress }: ApplyButtonProps): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      dataSet={{ action: "apply" }}
      testID="dispatch-apply"
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingVertical: SPACE[2],
        borderRadius: RADIUS[2],
        backgroundColor: t.accent,
        alignItems: "center",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: t.textInverse, fontWeight: "700" }]}>Apply</Text>
    </Pressable>
  );
}
