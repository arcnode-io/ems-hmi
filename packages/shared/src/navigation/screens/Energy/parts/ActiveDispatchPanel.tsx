/**
 * ActiveDispatchPanel — what dispatch is doing right now, on the Energy
 * screen. Reads the live dispatch lifecycle; falls back to the autopilot's
 * standing proposal while resting.
 *
 * Read-only — dispatch is controlled from the device's CommandPanel at the
 * desk console (constitution rule 3.1).
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { EDPanel } from "./EDPanel";
import { useDispatch } from "../../../../data/dispatch/useDispatch";
import { useDispatchTelemetry } from "../../../../data/dispatch/useDispatchTelemetry";
import {
  autopilotProposal,
  DEMO_DISPATCH_DEVICE_ID,
} from "../../../../data/dispatch/autopilot";
import {
  formatSetpoint,
  formatUsd,
  formatCountdown,
} from "../../../../data/dispatch/format";

interface KvProps {
  label: string;
  value: string;
  color?: string;
}

function Kv({ label, value, color }: KvProps): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 9,
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
            fontWeight: "600",
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 10, color: color ?? t.text, fontWeight: "700" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function alphaHex(hex: string, alpha: string): string {
  if (hex.startsWith("#") && hex.length === 7) return `${hex}${alpha}`;
  return hex;
}

export function ActiveDispatchPanel(): React.ReactElement {
  const t = useTheme();
  const { state } = useDispatch();
  const tel = useDispatchTelemetry();
  // Resting → show the autopilot's standing proposal; otherwise the live one.
  const proposal = state.proposal ?? autopilotProposal(DEMO_DISPATCH_DEVICE_ID);

  const tag = match(state.phase)
    .with("proposed", () => "AUTO")
    .with("pending", () => "PENDING")
    .with("executing", () => "LIVE")
    .with("settled", () => "SETTLED")
    .exhaustive();

  const status = match(state.phase)
    .with("proposed", () => "standing by")
    .with("pending", () => "awaiting ack")
    .with("executing", () => `settles ${formatCountdown(tel.secondsRemaining)}`)
    .with("settled", () => "settled")
    .exhaustive();

  const chipBg = alphaHex(t.colorBess, "14");

  return (
    <EDPanel accent={t.colorBess}>
      <View style={{ padding: SPACE[3], gap: 10 }}>
        {/* Row 1: tag + setpoint + status */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 5,
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 2,
              backgroundColor: chipBg,
            }}
          >
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                {
                  fontSize: 7,
                  fontWeight: "800",
                  letterSpacing: 0.3,
                  color: t.colorBess,
                  opacity: 0.7,
                  textTransform: "uppercase",
                },
              ]}
            >
              {tag}
            </Text>
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                {
                  fontSize: 10,
                  fontWeight: "700",
                  color: t.colorBess,
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                },
              ]}
            >
              {formatSetpoint(proposal.setpointKw)}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                letterSpacing: 0.15,
                color: t.text,
                fontWeight: "700",
                textTransform: "uppercase",
              },
            ]}
          >
            {status}
          </Text>
        </View>

        {/* Row 2: reason */}
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: 11, color: t.text, fontWeight: "600", lineHeight: 15 },
          ]}
        >
          {proposal.reason}
        </Text>

        {/* Row 3: KV strip */}
        <View
          style={{
            flexDirection: "row",
            gap: 14,
            paddingTop: 6,
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
            flexWrap: "wrap",
          }}
        >
          <Kv label="revenue" value={formatUsd(tel.revenueUsd)} color={t.colorBess} />
          <Kv label="price" value={`$${proposal.priceUsdPerMwh}/MWh`} />
        </View>
      </View>
    </EDPanel>
  );
}
