/**
 * TestResultRow — one row in the connection-test result list. Renders
 * an ok-tick or fail-cross + service name + detail (latency or error).
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Path } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import type { ConnResult } from "../../../../data/connection/useConnectionTest";

function rowColor(t: Theme, status: ConnResult["status"]): string {
  if (status === "ok") return t.statusOk;
  if (status === "error") return t.statusAlarm;
  return t.textSoft;
}

function alphaHex(hex: string, alpha: string): string {
  if (hex.startsWith("#") && hex.length === 7) return `${hex}${alpha}`;
  return hex;
}

interface BadgeProps {
  status: ConnResult["status"];
  color: string;
}

function Badge({ status, color }: BadgeProps): React.ReactElement {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        backgroundColor: alphaHex(color, "22"),
        borderWidth: 1,
        borderColor: alphaHex(color, "55"),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={9} height={9} viewBox="0 0 12 12">
        {status === "ok" ? (
          <Path
            d="M2.5 6.5 L5 9 L9.5 3.5"
            stroke={color}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : status === "error" ? (
          <Path
            d="M3 3 L9 9 M9 3 L3 9"
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <Path
            d="M6 3 V6 L8 8"
            stroke={color}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </Svg>
    </View>
  );
}

interface TestResultRowProps {
  result: ConnResult;
  showDivider: boolean;
}

export function TestResultRow({
  result,
  showDivider,
}: TestResultRowProps): React.ReactElement {
  const t = useTheme();
  const color = rowColor(t, result.status);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
        borderTopWidth: showDivider ? 1 : 0,
        borderTopColor: t.borderSoft,
      }}
    >
      <Badge status={result.status} color={color} />
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 12,
            fontWeight: "600",
            color: t.text,
            letterSpacing: 0.05,
            flex: 1,
          },
        ]}
      >
        {result.name}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 11,
            fontWeight: "600",
            color,
            letterSpacing: 0.05,
          },
        ]}
      >
        {result.detail}
      </Text>
    </View>
  );
}
