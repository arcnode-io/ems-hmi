/**
 * Settings-screen building blocks: SetSectionHead (label + sublabel) and
 * SetPanel (the card wrapper used across every section). Mirrors the
 * handoff (settings-screen.jsx) — Settings-local, not a canonical contract.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

interface SectionHeadProps {
  title: string;
  sub?: string;
}

export function SetSectionHead({
  title,
  sub,
}: SectionHeadProps): React.ReactElement {
  const t = useTheme();
  const labelStyle = {
    fontFamily: t.fontLabel,
    letterSpacing: 0.22,
    textTransform: "uppercase" as const,
  };
  return (
    <View
      style={{
        marginTop: SPACE[4],
        marginHorizontal: SPACE[4],
        marginBottom: SPACE[2],
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: SPACE[2],
      }}
    >
      <Text
        style={{
          ...labelStyle,
          fontSize: 10,
          fontWeight: "700",
          color: t.textMid,
          flex: 1,
        }}
      >
        {title}
      </Text>
      {sub ? (
        <Text
          style={{
            ...labelStyle,
            fontSize: 9,
            fontWeight: "500",
            color: t.textSoft,
            flexShrink: 0,
          }}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

interface PanelProps {
  /** Optional left-rail accent color. */
  accent?: string;
  children: React.ReactNode;
}

export function SetPanel({ accent, children }: PanelProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderLeftWidth: accent ? 3 : 1,
        borderLeftColor: accent ?? t.border,
        borderRadius: RADIUS[3],
      }}
    >
      {children}
    </View>
  );
}
