/**
 * DispatchBanner — a thin status strip shown while a dispatch is in flight.
 * Renders nothing while resting, so screens can mount it unconditionally.
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
import { useDispatchTelemetry } from "../../../data/dispatch/useDispatchTelemetry";
import {
  formatSetpoint,
  formatUsd,
  formatCountdown,
} from "../../../data/dispatch/format";

export function DispatchBanner(): React.ReactElement | null {
  const t = useTheme();
  const { state } = useDispatch();
  const tel = useDispatchTelemetry();

  if (state.phase === "proposed" || !state.proposal) return null;

  const setpoint = formatSetpoint(state.proposal.setpointKw);
  // `proposed` is excluded by the early return above.
  const text = match(state.phase)
    .with("pending", () => `${setpoint} — awaiting BESS ack`)
    .with(
      "executing",
      () => `${setpoint} — settles in ${formatCountdown(tel.secondsRemaining)}`,
    )
    .with(
      "settled",
      () => `Dispatch settled — earned ${formatUsd(tel.revenueUsd)}`,
    )
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
