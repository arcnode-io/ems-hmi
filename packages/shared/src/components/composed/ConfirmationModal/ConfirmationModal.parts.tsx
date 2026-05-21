/**
 * ConfirmationModal sub-parts — the SIMULATED band, a target row, and the
 * footer buttons. Split out to keep ConfirmationModal.tsx under the line cap.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import type { ConfirmationTarget } from "./ConfirmationModal.types";

/** Full-width SIMULATED banner pinned to the modal top. */
export function SimBand(): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ region: "sim-band" }}
      style={{
        backgroundColor: t.statusSim,
        paddingVertical: SPACE[2],
        alignItems: "center",
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            color: t.textInverse,
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 1.5,
          },
        ]}
      >
        SIMULATED
      </Text>
    </View>
  );
}

/** One target device — name + current state, so the operator reads before confirming. */
export function TargetRow({
  target,
}: {
  target: ConfirmationTarget;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: t.bg,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[2],
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
      }}
    >
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text }]}>
        {target.name}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textMid, fontVariant: ["tabular-nums"] },
        ]}
      >
        {target.currentState}
      </Text>
    </View>
  );
}

interface ModalButtonProps {
  label: string;
  variant: "ghost" | "accent";
  /** `data-action` for Playwright. */
  action: string;
  onPress: () => void;
}

/** A footer button — ghost (Cancel) or accent (Send). */
export function ModalButton({
  label,
  variant,
  action,
  onPress,
}: ModalButtonProps): React.ReactElement {
  const t = useTheme();
  const accent = variant === "accent";
  return (
    <Pressable
      accessibilityRole="button"
      dataSet={{ action }}
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: SPACE[2],
        borderRadius: RADIUS[2],
        alignItems: "center",
        ...(accent
          ? { backgroundColor: t.accent }
          : { borderWidth: 1, borderColor: t.border }),
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          accent
            ? { color: t.textInverse, fontWeight: "700" }
            : { color: t.textMid },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
