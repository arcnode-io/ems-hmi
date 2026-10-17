/**
 * DispatchBanner — a thin status strip shown while a command is in flight or
 * just failed. Renders nothing otherwise, so screens can mount it
 * unconditionally.
 *
 * Read-only: it reports the lifecycle, it does not control it.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { useDispatch } from "../../../data/dispatch/useDispatch";
import { formatSetpoint } from "../../../data/dispatch/format";

export function DispatchBanner(): React.ReactElement | null {
  const t = useTheme();
  const { state } = useDispatch();
  if (!state.command || state.phase === "idle" || state.phase === "settled") return null;

  const setpoint = formatSetpoint(state.command.setpointKw);
  const text = match(state.phase)
    .with("pending", () => `${setpoint} — awaiting BESS ack`)
    .with("failed", () => `Dispatch failed — ${state.reason ?? "see log"}`)
    .exhaustive();

  return (
    <View
      dataSet={{ comp: "DispatchBanner" }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
        backgroundColor: t.colorBess,
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 8,
            fontWeight: "800",
            letterSpacing: 0.4,
            color: t.textInverse,
          },
        ]}
      >
        DISPATCH
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 11, fontWeight: "700", color: t.textInverse },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}
