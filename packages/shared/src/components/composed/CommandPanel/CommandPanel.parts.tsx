/** CommandPanel sub-parts — signed-setpoint stepper + live dispatch status. */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useDispatch } from "../../../data/dispatch/useDispatch";
import type { SetpointRange } from "../../../data/dispatch/setpointRange";
import { formatSetpoint } from "../../../data/dispatch/format";

const STEP_KW = 100;

function StepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: RADIUS[2],
        borderWidth: 1,
        borderColor: t.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "cardHeading"),
          { color: t.text, fontSize: 18 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface SetpointStepperProps {
  valueKw: number;
  /** Catalog-rated range; steps clamp to it. */
  range: SetpointRange;
  onChange: (next: number) => void;
  disabled?: boolean;
}

/** [−] signed-value [+] — positive = discharge, negative = charge. */
export function SetpointStepper({
  valueKw,
  range,
  onChange,
  disabled = false,
}: SetpointStepperProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "SetpointStepper" }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
        backgroundColor: t.sunken,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[2],
        padding: SPACE[2],
      }}
    >
      <StepButton
        label="−"
        disabled={disabled || valueKw <= range.minKw}
        onPress={() => onChange(Math.max(range.minKw, valueKw - STEP_KW))}
      />
      <Text
        dataSet={{ field: "setpoint" }}
        style={[
          resolveTypeStyle(t, "cardHeading"),
          {
            flex: 1,
            textAlign: "center",
            color: t.text,
            fontVariant: ["tabular-nums"],
          },
        ]}
      >
        {formatSetpoint(valueKw)}
      </Text>
      <StepButton
        label="+"
        disabled={disabled || valueKw >= range.maxKw}
        onPress={() => onChange(Math.min(range.maxKw, valueKw + STEP_KW))}
      />
    </View>
  );
}

function StatusLine({
  text,
  color,
}: {
  text: string;
  color: string;
}): React.ReactElement {
  const t = useTheme();
  return (
    <Text
      dataSet={{ field: "dispatch-status" }}
      style={[resolveTypeStyle(t, "label"), { color, fontWeight: "700" }]}
    >
      {text}
    </Text>
  );
}

/** Status of the last command: in flight, accepted, or failed. */
export function DispatchStatusCard(): React.ReactElement {
  const t = useTheme();
  const { state } = useDispatch();
  const setpoint = state.command ? formatSetpoint(state.command.setpointKw) : "";

  return (
    <View
      testID="dispatch-status"
      dataSet={{ comp: "DispatchStatusCard", phase: state.phase }}
      style={{
        backgroundColor: t.sunken,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[2],
        padding: SPACE[3],
        gap: SPACE[2],
      }}
    >
      {match(state.phase)
        .with("pending", () => <StatusLine text={`${setpoint} · awaiting BESS ack…`} color={t.textMid} />)
        .with("settled", () => <StatusLine text={`${setpoint} · accepted by the BESS`} color={t.statusOk} />)
        .with("failed", () => (
          <StatusLine text={`${setpoint} · failed · ${state.reason ?? "no reason given"}`} color={t.statusAlarm} />
        ))
        .with("idle", () => <StatusLine text="No command sent" color={t.textSoft} />)
        .exhaustive()}
    </View>
  );
}
