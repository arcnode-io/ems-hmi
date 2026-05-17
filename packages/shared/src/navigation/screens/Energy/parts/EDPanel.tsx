/**
 * EDPanel — small card wrapper shared across Energy parts (panel + optional
 * left-rail accent). Mirrors the EnergyDetailScreen mock's "EDPanel"
 * primitive — Energy-local, not a canonical contract.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

interface EDPanelProps {
  /** Hex accent color for the left rail (optional). */
  accent?: string;
  children: React.ReactNode;
}

export function EDPanel({ accent, children }: EDPanelProps): React.ReactElement {
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

interface EDSectionHeadProps {
  title: string;
  meta?: string;
}

/** Section header — uppercase label + optional right-aligned meta. */
export function EDSectionHead({ title, meta }: EDSectionHeadProps): React.ReactElement {
  const t = useTheme();
  const baseLabel = {
    fontFamily: t.fontLabel,
    letterSpacing: 0.18,
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
        numberOfLines={1}
        style={{
          ...baseLabel,
          fontSize: 10,
          fontWeight: "700",
          color: t.textMid,
          flex: 1,
        }}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          numberOfLines={1}
          style={{
            ...baseLabel,
            fontSize: 9,
            fontWeight: "500",
            color: t.textSoft,
            flexShrink: 0,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );
}
