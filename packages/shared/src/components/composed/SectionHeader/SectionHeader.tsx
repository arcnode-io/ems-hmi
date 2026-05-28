/**
 * SectionHeader — Tier-1 structural label for card-groups + panels.
 * Anatomy: label chip (left) · heading + optional sub (mid) · optional action (right).
 * See design-handoff/02-components/SectionHeader.md.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

export interface SectionHeaderProps {
  /** Uppercase tag chip, e.g. "ENERGY". */
  label: string;
  /** Heading text — renders as semantic h2 via accessibilityRole. */
  heading: string;
  /** Optional sub-line beneath the heading. */
  sub?: string;
  /** Optional right-aligned action (link / button). */
  action?: React.ReactNode;
}

/**
 * Render a section header row.
 * @param props label + heading + optional sub + optional action
 * @returns View element
 */
export function SectionHeader({
  label,
  heading,
  sub,
  action,
}: SectionHeaderProps): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";

  return (
    <View
      dataSet={{
        comp: "SectionHeader",
        "has-sub": sub ? "true" : "false",
        "has-action": action ? "true" : "false",
      }}
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        gap: SPACE[3],
        width: "100%",
      }}
    >
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: SPACE[2],
          borderRadius: RADIUS[2],
          backgroundColor: t.accentFaint,
          borderWidth: 1,
          borderColor: t.accentBorder,
          flexShrink: 0,
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: t.accent },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[
            resolveTypeStyle(t, "cardHeading"),
            {
              color: t.text,
              ...(isSov
                ? { textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "400" }
                : null),
            },
          ]}
        >
          {heading}
        </Text>
        {sub ? (
          <Text
            style={[
              resolveTypeStyle(t, "bodyDense"),
              { color: t.textMid, marginTop: 2 },
            ]}
          >
            {sub}
          </Text>
        ) : null}
      </View>

      {action ? <View style={{ flexShrink: 0 }}>{action}</View> : null}
    </View>
  );
}
