/**
 * ActiveDispatchPanel — shows what the autopilot is doing right now +
 * countdown to next settlement interval.
 *
 * Read-only on phone per constitution rule 3.1; dispatch overrides
 * happen at the desk console.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { EDPanel } from "./EDPanel";
import { MOCK_ENERGY } from "../data/mockEnergy";

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
  const d = MOCK_ENERGY.dispatch;
  const mins = Math.floor(d.intervalSecLeft / 60);
  const secs = String(d.intervalSecLeft % 60).padStart(2, "0");
  const chipBg = alphaHex(t.colorBess, "14");

  return (
    <EDPanel accent={t.colorBess}>
      <View style={{ padding: SPACE[3], gap: 10 }}>
        {/* Row 1: AUTO action chip + countdown */}
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
              AUTO
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
              {d.action}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                letterSpacing: 0.15,
                color: t.textMid,
                fontWeight: "600",
                textTransform: "uppercase",
              },
            ]}
          >
            settles{" "}
            <Text style={{ color: t.text, fontWeight: "700" }}>
              {mins}:{secs}
            </Text>
          </Text>
        </View>

        {/* Row 2: reason */}
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: 11, color: t.text, fontWeight: "600", lineHeight: 15 },
          ]}
        >
          {d.reason}
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
          <Kv label="conf" value={`${Math.round(d.confidence * 100)}%`} />
          <Kv label="bess" value={`${d.bessSocPct}%`} color={t.colorBess} />
        </View>
      </View>
    </EDPanel>
  );
}
