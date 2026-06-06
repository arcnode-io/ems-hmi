/** CommandPanel sub-parts — signed-setpoint stepper + live dispatch status. */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useDispatch } from "../../../data/dispatch/useDispatch";
import { useDispatchTelemetry } from "../../../data/dispatch/useDispatchTelemetry";
import {
  formatSetpoint,
  formatUsd,
  formatCountdown,
} from "../../../data/dispatch/format";

/** Setpoint bounds — the BESS active-power warn band, kW. */
export const MIN_SETPOINT_KW = -1800;
export const MAX_SETPOINT_KW = 1800;
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
  onChange: (next: number) => void;
  disabled?: boolean;
}

/** [−] signed-value [+] — positive = discharge, negative = charge. */
export function SetpointStepper({
  valueKw,
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
        disabled={disabled || valueKw <= MIN_SETPOINT_KW}
        onPress={() => onChange(Math.max(MIN_SETPOINT_KW, valueKw - STEP_KW))}
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
        disabled={disabled || valueKw >= MAX_SETPOINT_KW}
        onPress={() => onChange(Math.min(MAX_SETPOINT_KW, valueKw + STEP_KW))}
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

/** Live status while a dispatch is pending / executing / settled. */
export function DispatchStatusCard(): React.ReactElement {
  const t = useTheme();
  const { state } = useDispatch();
  const tel = useDispatchTelemetry();

  return (
    <View
      dataSet={{ comp: "DispatchStatusCard" }}
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
        .with("pending", () => (
          <StatusLine text="Awaiting BESS ack…" color={t.textMid} />
        ))
        .with("executing", () => (
          <>
            <StatusLine
              text={`Executing · settles in ${formatCountdown(tel.secondsRemaining)}`}
              color={t.colorBess}
            />
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: t.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.round(tel.progress * 100)}%`,
                  height: "100%",
                  backgroundColor: t.colorBess,
                }}
              />
            </View>
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                { color: t.textSoft, fontSize: 10 },
              ]}
            >
              Revenue {formatUsd(tel.revenueUsd)}
            </Text>
          </>
        ))
        .with("settled", () => (
          <StatusLine
            text={`Settled · earned ${formatUsd(tel.revenueUsd)}`}
            color={t.statusOk}
          />
        ))
        .with("failed", () => (
          <StatusLine
            text={`Dispatch failed · ${state.reason ?? "no reason given"}`}
            color={t.statusAlarm}
          />
        ))
        .with("proposed", () => <StatusLine text="Idle" color={t.textSoft} />)
        .exhaustive()}
    </View>
  );
}
